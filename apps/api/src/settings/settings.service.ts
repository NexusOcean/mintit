import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import type { EnvironmentVariables } from '../config/env.validation';
import { Chain } from '@mintit/types';

export type SettingsFields = {
  confirmationDepth: number;
  invoiceDefaultExpirySec: number;
  invoiceMaxExpirySec: number;
  scannerLockTtlMs: number;
  syncedThresholdBlocks: number;
  rateCacheTtlMs: number;
  webhookMaxAttempts: number;
  webhookTimeoutMs: number;
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly log = new Logger(SettingsService.name);
  private cache = new Map<Chain, SettingsFields>();

  constructor(
    @InjectModel(Settings.name)
    private readonly model: Model<SettingsDocument>,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    const chains = this.config.get<Chain[]>('ENABLED_CHAINS') ?? [];

    for (const chain of chains) {
      await this.load(chain);
    }
  }

  async load(chain: Chain): Promise<void> {
    const existing = await this.model.findOne({ key: chain }).lean();

    if (existing) {
      this.cache.set(chain, this.project(existing));
      this.log.log('Settings loaded from Mongo');
      return;
    }

    const seed: SettingsFields = {
      confirmationDepth: this.config.get('CONFIRMATION_DEPTH', { infer: true }),
      invoiceDefaultExpirySec: this.config.get('INVOICE_DEFAULT_EXPIRY_SEC', {
        infer: true,
      }),
      invoiceMaxExpirySec: this.config.get('INVOICE_MAX_EXPIRY_SEC', {
        infer: true,
      }),
      scannerLockTtlMs: this.config.get('SCANNER_LOCK_TTL_MS', { infer: true }),
      syncedThresholdBlocks: this.config.get('MONERO_SYNCED_THRESHOLD_BLOCKS', {
        infer: true,
      }),
      rateCacheTtlMs: this.config.get('RATE_CACHE_TTL_MS', { infer: true }),
      webhookMaxAttempts: this.config.get('WEBHOOK_MAX_ATTEMPTS', {
        infer: true,
      }),
      webhookTimeoutMs: this.config.get('WEBHOOK_TIMEOUT_MS', { infer: true }),
    };

    await this.model.updateOne(
      { key: chain },
      { $setOnInsert: seed },
      { upsert: true },
    );

    const doc = await this.model.findOne({ key: chain }).lean();
    if (!doc) throw new Error(`Settings doc missing for ${chain} after upsert`);
    this.cache.set(chain, this.project(doc));

    this.log.log(`Settings loaded for ${chain}`);
  }

  private project(doc: SettingsFields): SettingsFields {
    return {
      confirmationDepth: doc.confirmationDepth,
      invoiceDefaultExpirySec: doc.invoiceDefaultExpirySec,
      invoiceMaxExpirySec: doc.invoiceMaxExpirySec,
      scannerLockTtlMs: doc.scannerLockTtlMs,
      syncedThresholdBlocks: doc.syncedThresholdBlocks,
      rateCacheTtlMs: doc.rateCacheTtlMs,
      webhookMaxAttempts: doc.webhookMaxAttempts,
      webhookTimeoutMs: doc.webhookTimeoutMs,
    };
  }

  get<K extends keyof SettingsFields>(chain: Chain, key: K): SettingsFields[K] {
    const v = this.cache.get(chain);
    if (!v) throw new Error(`Settings not loaded for chain: ${chain}`);
    return v[key];
  }

  getAll(chain: Chain): SettingsFields {
    const v = this.cache.get(chain);
    if (!v) throw new Error(`Settings not loaded for chain: ${chain}`);
    return { ...v };
  }

  async update(
    chain: Chain,
    partial: Partial<SettingsFields>,
  ): Promise<SettingsFields> {
    const set: Partial<SettingsFields> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) (set as Record<string, unknown>)[k] = v;
    }
    if (Object.keys(set).length === 0) return this.getAll(chain);

    const updated = await this.model
      .findOneAndUpdate(
        { key: chain },
        { $set: set },
        { returnDocument: 'after', upsert: false, runValidators: true },
      )
      .lean();

    if (!updated) {
      throw new Error(
        `Settings document missing for chain ${chain}; load() not run`,
      );
    }
    this.cache.set(chain, this.project(updated));
    return this.getAll(chain);
  }
}
