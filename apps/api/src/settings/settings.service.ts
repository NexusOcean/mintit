import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import type { EnvironmentVariables } from '../config/env.validation';
import { Chain } from '@mintit/types';

export interface GlobalSettingsFields {
  rateCacheTtlMs: number;
  webhookMaxAttempts: number;
  webhookTimeoutMs: number;
  webhookDispatchIntervalMs: number;
}

export interface SettingsFields extends GlobalSettingsFields {
  confirmationDepth: number;
  invoiceDefaultExpirySec: number;
  invoiceMaxExpirySec: number;
  scannerLockTtlMs: number;
  syncedThresholdBlocks: number;
}

const GLOBAL_KEY = 'global' as const;

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly log = new Logger(SettingsService.name);
  private cache = new Map<
    Chain | typeof GLOBAL_KEY,
    SettingsFields | GlobalSettingsFields
  >();

  constructor(
    @InjectModel(Settings.name)
    private readonly model: Model<SettingsDocument>,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadGlobal();
    const chains = this.config.get<Chain[]>('ENABLED_CHAINS') ?? [];
    for (const chain of chains) {
      await this.load(chain);
    }
  }

  async loadGlobal(): Promise<void> {
    const existing = await this.model.findOne({ key: GLOBAL_KEY }).lean();

    if (existing) {
      this.cache.set(GLOBAL_KEY, this.projectGlobal(existing));
      this.log.log('Global settings loaded from Mongo');
      return;
    }

    const seed: GlobalSettingsFields = {
      rateCacheTtlMs: this.config.get('RATE_CACHE_TTL_MS', { infer: true }),
      webhookMaxAttempts: this.config.get('WEBHOOK_MAX_ATTEMPTS', {
        infer: true,
      }),
      webhookTimeoutMs: this.config.get('WEBHOOK_TIMEOUT_MS', { infer: true }),
      webhookDispatchIntervalMs: this.config.get(
        'WEBHOOK_DISPATCH_INTERVAL_MS',
        { infer: true },
      ),
    };

    await this.model.updateOne(
      { key: GLOBAL_KEY },
      { $setOnInsert: seed },
      { upsert: true },
    );

    const doc = await this.model.findOne({ key: GLOBAL_KEY }).lean();
    if (!doc) throw new Error('Global settings doc missing after upsert');
    this.cache.set(GLOBAL_KEY, this.projectGlobal(doc));
    this.log.log('Global settings seeded');
  }

  async load(chain: Chain): Promise<void> {
    const existing = await this.model.findOne({ key: chain }).lean();

    if (existing) {
      this.cache.set(chain, this.project(existing));
      this.log.log(`Settings loaded from Mongo for ${chain}`);
      return;
    }

    const seed: SettingsFields = {
      ...this.getGlobal(),
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
    };

    await this.model.updateOne(
      { key: chain },
      { $setOnInsert: seed },
      { upsert: true },
    );

    const doc = await this.model.findOne({ key: chain }).lean();
    if (!doc) throw new Error(`Settings doc missing for ${chain} after upsert`);
    this.cache.set(chain, this.project(doc));
    this.log.log(`Settings seeded for ${chain}`);
  }

  private projectGlobal(
    doc: Partial<GlobalSettingsFields>,
  ): GlobalSettingsFields {
    return {
      rateCacheTtlMs: doc.rateCacheTtlMs!,
      webhookMaxAttempts: doc.webhookMaxAttempts!,
      webhookTimeoutMs: doc.webhookTimeoutMs!,
      webhookDispatchIntervalMs: doc.webhookDispatchIntervalMs!,
    };
  }

  private project(doc: Partial<SettingsFields>): SettingsFields {
    return {
      ...this.projectGlobal(doc),
      confirmationDepth: doc.confirmationDepth!,
      invoiceDefaultExpirySec: doc.invoiceDefaultExpirySec!,
      invoiceMaxExpirySec: doc.invoiceMaxExpirySec!,
      scannerLockTtlMs: doc.scannerLockTtlMs!,
      syncedThresholdBlocks: doc.syncedThresholdBlocks!,
    };
  }

  get<K extends keyof SettingsFields>(chain: Chain, key: K): SettingsFields[K] {
    const v = this.cache.get(chain) as SettingsFields | undefined;
    if (!v) throw new Error(`Settings not loaded for chain: ${chain}`);
    return v[key];
  }

  getGlobal(): GlobalSettingsFields {
    const v = this.cache.get(GLOBAL_KEY);
    if (!v) throw new Error('Global settings not loaded');
    return { ...v };
  }

  getAll(chain: Chain): SettingsFields {
    const v = this.cache.get(chain) as SettingsFields | undefined;
    if (!v) throw new Error(`Settings not loaded for chain: ${chain}`);
    return { ...v };
  }

  async updateGlobal(
    partial: Partial<GlobalSettingsFields>,
  ): Promise<GlobalSettingsFields> {
    const set: Partial<GlobalSettingsFields> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) (set as Record<string, unknown>)[k] = v;
    }
    if (Object.keys(set).length === 0) return this.getGlobal();

    const updated = await this.model
      .findOneAndUpdate(
        { key: GLOBAL_KEY },
        { $set: set },
        { returnDocument: 'after', upsert: false, runValidators: true },
      )
      .lean();

    if (!updated) throw new Error('Global settings document missing');
    this.cache.set(GLOBAL_KEY, this.projectGlobal(updated));
    return this.getGlobal();
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

    if (!updated)
      throw new Error(`Settings document missing for chain ${chain}`);
    this.cache.set(chain, this.project(updated));
    return this.getAll(chain);
  }
}
