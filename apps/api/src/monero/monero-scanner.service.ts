import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { MoneroService } from './monero.service';
import { ScannerLockService } from '../scanner/scanner-lock.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhookEvent } from '../webhooks/schemas/webhook-delivery.schema';
import type { MoneroIncomingTransfer } from 'monero-ts';
import { SettingsService } from '../settings/settings.service';
import { Chain, InvoiceStatus } from '@mintit/types';

const LOCK_NAME = 'xmr-payment-scanner';
const CHAIN = Chain.Xmr;
const NON_TERMINAL: InvoiceStatus[] = [
  InvoiceStatus.Pending,
  InvoiceStatus.Seen,
  InvoiceStatus.Underpaid,
];
const ACCOUNT_INDEX = 0;

@Injectable()
export class MoneroScannerService {
  private readonly log = new Logger(MoneroScannerService.name);
  private running = false;

  constructor(
    @InjectModel(Invoice.name)
    private readonly invoices: Model<InvoiceDocument>,
    @InjectModel(Payment.name)
    private readonly payments: Model<PaymentDocument>,
    private readonly monero: MoneroService,
    private readonly lock: ScannerLockService,
    private readonly webhooks: WebhooksService,
    private readonly settings: SettingsService,
  ) {}

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const ttl = this.settings.get(Chain.Xmr, 'scannerLockTtlMs');
      const acquired = await this.lock.acquire(LOCK_NAME, ttl);
      if (!acquired) return;
      try {
        await this.runOnce();
      } finally {
        await this.lock.release(LOCK_NAME);
      }
    } catch (err) {
      this.log.error(
        `Scanner tick failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    } finally {
      this.running = false;
    }
  }

  private async runOnce(): Promise<void> {
    // 1. Sync wallet against daemon.
    await this.monero.sync();

    // 2. Process active invoices.
    const active = await this.invoices.find({
      chain: CHAIN,
      status: { $in: NON_TERMINAL },
    });

    if (active.length === 0) {
      await this.expireStale();
      return;
    }

    const wallet = this.monero.getClient();
    const addressIndices = active.map((i) => i.addressIndex);

    // Fetch incoming + pool transfers for our subaddresses in one shot.
    const [confirmed, pool] = await Promise.all([
      wallet.getTransfers({
        accountIndex: ACCOUNT_INDEX,
        subaddressIndices: addressIndices,
        isIncoming: true,
      }),
      wallet.getTransfers({
        accountIndex: ACCOUNT_INDEX,
        subaddressIndices: addressIndices,
        isIncoming: true,
        txQuery: { inTxPool: true },
      }),
    ]);
    this.log.log(
      `Tick: confirmed=${confirmed.length} pool=${pool.length} for subs=[${addressIndices.join(',')}]`,
    );
    const transfers = [...confirmed, ...pool];

    // Group transfers by addressIndex for fast invoice lookup.
    const byAddressIndex = new Map<number, MoneroIncomingTransfer[]>();
    for (const t of transfers) {
      if (!t.getIsIncoming()) continue;
      const incoming = t as MoneroIncomingTransfer;
      const idx = incoming.getSubaddressIndex();
      if (idx === undefined) continue;
      const arr = byAddressIndex.get(idx) ?? [];
      arr.push(incoming);
      byAddressIndex.set(idx, arr);
    }

    for (const inv of active) {
      try {
        const subTransfers = byAddressIndex.get(inv.addressIndex) ?? [];
        await this.processInvoice(inv, subTransfers);
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
    transfers: MoneroIncomingTransfer[],
  ): Promise<void> {
    if (transfers.length === 0) return;

    const known = await this.payments
      .find(
        { chain: CHAIN, invoiceId: inv._id },
        { txHash: 1, addressIndex: 1, confirmedAt: 1 },
      )
      .lean()
      .exec();
    const knownMap = new Map(
      known.map((p) => [`${p.txHash}:${p.addressIndex}`, p]),
    );

    let changed = false;

    for (const incoming of transfers) {
      const tx = incoming.getTx();
      const txHash = tx.getHash();
      const addressIdx = incoming.getSubaddressIndex();
      if (!txHash || addressIdx === undefined) continue;

      const amountPiconero = incoming.getAmount().toString();
      const isConfirmed = tx.getIsConfirmed() === true;
      const isUnlocked = tx.getIsLocked() === false;
      const numConfirmations = Number(tx.getNumConfirmations() ?? 0);
      const blockHeight = tx.getHeight();

      const key = `${txHash}:${addressIdx}`;
      const existing = knownMap.get(key);

      this.log.log(
        `tx ${txHash} sub=${addressIdx} confs=${numConfirmations} isConfirmed=${isConfirmed}`,
      );

      if (!existing) {
        await this.payments
          .create({
            chain: CHAIN,
            invoiceId: inv._id,
            address: inv.address,
            addressIndex: addressIdx,
            txHash,
            amountAtomic: amountPiconero,
            confirmations: numConfirmations,
            unlocked: isUnlocked,
            blockHeight: blockHeight ?? undefined,
            firstSeenAt: new Date(),
            ...(isConfirmed ? { confirmedAt: new Date() } : {}),
          })
          .catch((err: { code?: number }) => {
            if (err.code !== 11000) throw err;
          });
        changed = true;
      } else {
        // Only stamp confirmedAt on the transition (prevents drift).
        const stampConfirmed = isConfirmed && !existing.confirmedAt;
        const res = await this.payments
          .updateOne(
            {
              chain: CHAIN,
              invoiceId: inv._id,
              txHash,
              addressIndex: addressIdx,
            },
            {
              $set: {
                amountAtomic: amountPiconero,
                confirmations: numConfirmations,
                unlocked: isUnlocked,
                blockHeight: blockHeight ?? undefined,
                ...(stampConfirmed ? { confirmedAt: new Date() } : {}),
              },
            },
          )
          .exec();
        if (res.modifiedCount > 0) changed = true;
      }
    }

    if (changed || NON_TERMINAL.includes(inv.status)) {
      await this.recomputeInvoice(inv._id);
    }
  }

  private async recomputeInvoice(invoiceId: Types.ObjectId): Promise<void> {
    const inv = await this.invoices
      .findOne({ _id: invoiceId, chain: CHAIN })
      .exec();
    if (!inv) return;
    if (!NON_TERMINAL.includes(inv.status)) return;

    const pays = await this.payments.find({ chain: CHAIN, invoiceId }).exec();
    if (pays.length === 0) return;

    const required = inv.confirmationsRequired;

    // BigInt sum of atomic units.
    const totalReceived = pays.reduce(
      (acc, p) => acc + BigInt(p.amountAtomic),
      0n,
    );
    const owed = BigInt(inv.amountAtomic);

    // Min confirmations across payments (weakest link).
    const minConfirmations = pays.reduce(
      (acc, p) => Math.min(acc, p.confirmations),
      Number.POSITIVE_INFINITY,
    );

    // Confirmed for payment: meets depth.
    const isConfirmed = minConfirmations >= required;

    const updates: Partial<Invoice> = {
      receivedAtomic: totalReceived.toString(),
      confirmations: minConfirmations === Infinity ? 0 : minConfirmations,
    };

    let nextStatus: InvoiceStatus = inv.status;
    let webhookEvent: WebhookEvent | null = null;

    if (inv.status === InvoiceStatus.Pending) {
      nextStatus = InvoiceStatus.Seen;
      updates.firstSeenAt = inv.firstSeenAt ?? new Date();
      webhookEvent = WebhookEvent.InvoiceSeen;
    }

    if (isConfirmed) {
      if (totalReceived >= owed) {
        nextStatus = InvoiceStatus.Confirmed;
        updates.paidAt = new Date();
        webhookEvent = WebhookEvent.InvoiceConfirmed;
      } else {
        nextStatus = InvoiceStatus.Underpaid;
        webhookEvent = WebhookEvent.InvoiceUnderpaid;
      }
    }

    const statusChanged = nextStatus !== inv.status;
    updates.status = nextStatus;

    await this.invoices.updateOne({ _id: inv._id }, { $set: updates }).exec();

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
    const stale = await this.invoices
      .find({
        chain: CHAIN,
        status: InvoiceStatus.Pending,
        expiresAt: { $lte: now },
      })
      .exec();

    for (const inv of stale) {
      const res = await this.invoices
        .updateOne(
          { _id: inv._id, status: InvoiceStatus.Pending },
          { $set: { status: InvoiceStatus.Expired } },
        )
        .exec();
      // Gate webhook on actual transition (avoid double-fire on race).
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
