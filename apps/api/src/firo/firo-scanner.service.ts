import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { Invoice } from '../invoices/schemas/invoice.entity';
import { FiroService } from './firo.service';
import { ScannerLockService } from '../scanner/scanner-lock.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhookEvent } from '../webhooks/schemas/webhook-delivery.entity';
import { SettingsService } from '../settings/settings.service';
import { Chain, InvoiceStatus } from '@mintit/types';

const LOCK_NAME = 'firo-payment-scanner';
const CHAIN = Chain.Firo;
const NON_TERMINAL: InvoiceStatus[] = [
  InvoiceStatus.Pending,
  InvoiceStatus.Seen,
  InvoiceStatus.Underpaid,
];

@Injectable()
export class FiroScannerService {
  private readonly log = new Logger(FiroScannerService.name);
  private running = false;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    private readonly firo: FiroService,
    private readonly lock: ScannerLockService,
    private readonly webhooks: WebhooksService,
    private readonly settings: SettingsService,
  ) {}

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const ttl = this.settings.get(Chain.Firo, 'scannerLockTtlMs');
      const acquired = await this.lock.acquire(LOCK_NAME, ttl);
      if (!acquired) return;
      try {
        await this.runOnce();
      } finally {
        await this.lock.release(LOCK_NAME);
      }
    } catch (err) {
      this.log.error(
        `Firo scanner tick failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    } finally {
      this.running = false;
    }
  }

  private async runOnce(): Promise<void> {
    const tipHeight = await this.firo.getBlockCount();

    const active = await this.invoices.find({
      where: { chain: CHAIN, status: In(NON_TERMINAL) },
    });

    if (active.length === 0) {
      await this.expireStale();
      return;
    }

    for (const inv of active) {
      try {
        await this.processInvoice(inv, tipHeight);
      } catch (err) {
        this.log.warn(
          `Invoice ${inv.id} processing failed: ${(err as Error).message}`,
        );
      }
    }

    await this.expireStale();
  }

  private async processInvoice(
    inv: Invoice,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tipHeight: number,
  ): Promise<void> {
    let balance: {
      availableBalance: number;
      unconfirmedBalance: number;
      fullBalance: number;
    };
    try {
      balance = await this.firo.rpc.getSparkAddressBalance(inv.address);
    } catch (err) {
      this.log.warn(`getsparkaddressbalance failed for ${inv.address}: ${err}`);
      return;
    }

    if (!balance.fullBalance) return;

    const availableAtomic = BigInt(balance.availableBalance ?? 0);
    const unconfirmedAtomic = BigInt(balance.unconfirmedBalance ?? 0);
    const receivedAtomic = availableAtomic + unconfirmedAtomic;

    const owed = BigInt(inv.amountAtomic);

    const updates: Pick<Invoice, 'receivedAtomic'> &
      Partial<
        Pick<Invoice, 'firstSeenAt' | 'confirmations' | 'paidAt' | 'status'>
      > = {
      receivedAtomic: receivedAtomic.toString(),
    };

    let nextStatus: InvoiceStatus = inv.status;
    let webhookEvent: WebhookEvent | null = null;

    if (inv.status === InvoiceStatus.Pending && balance.fullBalance > 0) {
      nextStatus = InvoiceStatus.Seen;
      updates.firstSeenAt = inv.firstSeenAt ?? new Date();
      updates.confirmations = 0;
      webhookEvent = WebhookEvent.InvoiceSeen;
    }

    if (availableAtomic > 0n) {
      if (availableAtomic >= owed) {
        nextStatus = InvoiceStatus.Confirmed;
        updates.confirmations = 1;
        updates.paidAt = new Date();
        webhookEvent = WebhookEvent.InvoiceConfirmed;
      } else {
        nextStatus = InvoiceStatus.Underpaid;
        updates.confirmations = 1;
        webhookEvent = WebhookEvent.InvoiceUnderpaid;
      }
    }

    updates.status = nextStatus;
    const statusChanged = nextStatus !== inv.status;

    await this.invoices.update({ id: inv.id }, updates);

    if (statusChanged && webhookEvent && inv.webhookUrl) {
      await this.webhooks.enqueue(inv.id, inv.webhookUrl, webhookEvent, {
        invoiceId: inv.id,
        chain: inv.chain,
        asset: inv.asset,
        assetDecimals: inv.assetDecimals,
        status: nextStatus,
        address: inv.address,
        amountAtomic: inv.amountAtomic,
        receivedAtomic: updates.receivedAtomic,
        confirmations: updates.confirmations,
      });
    }
  }

  private async expireStale(): Promise<void> {
    const now = new Date();
    const stale = await this.invoices.find({
      where: {
        chain: CHAIN,
        status: InvoiceStatus.Pending,
        expiresAt: LessThanOrEqual(now),
      },
    });

    for (const inv of stale) {
      const res = await this.invoices.update(
        { id: inv.id, status: InvoiceStatus.Pending },
        { status: InvoiceStatus.Expired },
      );

      if ((res.affected ?? 0) > 0 && inv.webhookUrl) {
        await this.webhooks.enqueue(
          inv.id,
          inv.webhookUrl,
          WebhookEvent.InvoiceExpired,
          {
            invoiceId: inv.id,
            chain: inv.chain,
            asset: inv.asset,
            assetDecimals: inv.assetDecimals,
            status: InvoiceStatus.Expired,
            address: inv.address,
          },
        );
      }
    }
  }
}
