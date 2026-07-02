import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema';
import { FiroService } from './firo.service';
import { ScannerLockService } from '../scanner/scanner-lock.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhookEvent } from '../webhooks/schemas/webhook-delivery.schema';
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
    @InjectModel(Invoice.name)
    private readonly invoices: Model<InvoiceDocument>,
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
      chain: CHAIN,
      status: { $in: NON_TERMINAL },
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
          `Invoice ${inv._id.toString()} processing failed: ${(err as Error).message}`,
        );
      }
    }

    await this.expireStale();
  }

  private async processInvoice(
    inv: InvoiceDocument,
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

    const updates: Partial<Invoice> = {
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

    await this.invoices.updateOne({ _id: inv._id }, { $set: updates });

    if (statusChanged && webhookEvent && inv.webhookUrl) {
      await this.webhooks.enqueue(inv._id, inv.webhookUrl, webhookEvent, {
        invoiceId: inv._id.toString(),
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
      chain: CHAIN,
      status: InvoiceStatus.Pending,
      expiresAt: { $lte: now },
    });

    for (const inv of stale) {
      const res = await this.invoices.updateOne(
        { _id: inv._id, status: InvoiceStatus.Pending },
        { $set: { status: InvoiceStatus.Expired } },
      );

      if (res.modifiedCount > 0 && inv.webhookUrl) {
        await this.webhooks.enqueue(
          inv._id,
          inv.webhookUrl,
          WebhookEvent.InvoiceExpired,
          {
            invoiceId: inv._id.toString(),
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
