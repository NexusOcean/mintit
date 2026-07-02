import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { createHmac, randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  WebhookDelivery,
  WebhookDeliveryDocument,
  WebhookDeliveryStatus,
  WebhookEvent,
} from './schemas/webhook-delivery.schema';
import type { EnvironmentVariables } from '../config/env.validation';
import { SettingsService } from '../settings/settings.service';
import { Chain } from '@mintit/types';

const CHAIN = Chain.Xmr;

@Injectable()
export class WebhooksService {
  private readonly log = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(WebhookDelivery.name)
    private readonly model: Model<WebhookDeliveryDocument>,
    private readonly http: HttpService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly settings: SettingsService,
  ) {}

  async enqueue(
    invoiceId: Types.ObjectId,
    url: string,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const existing = await this.model
      .findOne({ chain: CHAIN, invoiceId, event })
      .exec();
    if (existing) return;

    await this.model.create({
      chain: CHAIN,
      invoiceId,
      url,
      event,
      payload: {
        id: randomUUID(),
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      },
      attempts: 0,
      nextAttemptAt: new Date(),
      status: WebhookDeliveryStatus.Pending,
    });
  }

  async dispatchDue(): Promise<void> {
    const now = new Date();
    const due = await this.model
      .find({
        status: WebhookDeliveryStatus.Pending,
        nextAttemptAt: { $lte: now },
      })
      .limit(20);

    await Promise.all(due.map((d) => this.attempt(d)));
  }

  private async attempt(delivery: WebhookDeliveryDocument): Promise<void> {
    const secret = this.config.get('WEBHOOK_SIGNING_SECRET', { infer: true });
    const maxAttempts = this.settings.get(delivery.chain, 'webhookMaxAttempts');
    const timeout = this.settings.get(delivery.chain, 'webhookTimeoutMs');
    const body = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    delivery.attempts += 1;

    try {
      const res = await firstValueFrom(
        this.http.post(delivery.url, body, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Signature': `t=${timestamp},v1=${signature}`,
            'X-Api-Event': delivery.event,
            'X-Api-Delivery-Id': delivery._id.toString(),
          },
          timeout,
          validateStatus: () => true,
        }),
      );
      delivery.lastResponseCode = res.status;
      if (res.status >= 200 && res.status < 300) {
        delivery.status = WebhookDeliveryStatus.Delivered;
        delivery.lastError = undefined;
      } else {
        delivery.lastError = `HTTP ${res.status}`;
        this.scheduleRetry(delivery, maxAttempts);
      }
    } catch (err) {
      delivery.lastError = (err as Error).message;
      this.scheduleRetry(delivery, maxAttempts);
    }

    await delivery.save();
  }

  private scheduleRetry(delivery: WebhookDeliveryDocument, max: number): void {
    if (delivery.attempts >= max) {
      delivery.status = WebhookDeliveryStatus.DeadLettered;
      this.log.warn(
        `Webhook ${delivery._id.toString()} dead-lettered after ${delivery.attempts} attempts`,
      );
      return;
    }
    const base = 30_000;
    const delay = Math.min(
      base * Math.pow(2, delivery.attempts - 1),
      60 * 60_000,
    );
    delivery.nextAttemptAt = new Date(Date.now() + delay);
    delivery.status = WebhookDeliveryStatus.Pending;
  }
}
