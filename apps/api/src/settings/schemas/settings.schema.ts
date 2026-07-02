import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;
export const SETTINGS_KEY = 'monero';

@Schema({ collection: 'settings', timestamps: true })
export class Settings {
  @Prop({ type: String, required: true, unique: true })
  key!: string;

  @Prop({ type: Number, required: true, min: 1 })
  confirmationDepth!: number;

  @Prop({ type: Number, required: true, min: 60 })
  invoiceDefaultExpirySec!: number;

  @Prop({ type: Number, required: true, min: 60 })
  invoiceMaxExpirySec!: number;

  @Prop({ type: Number, required: true, min: 1000 })
  scannerLockTtlMs!: number;

  @Prop({ type: Number, required: true, min: 1 })
  syncedThresholdBlocks!: number;

  @Prop({ type: Number, required: true, min: 0 })
  rateCacheTtlMs!: number;

  @Prop({ type: Number, required: true, min: 1 })
  webhookMaxAttempts!: number;

  @Prop({ type: Number, required: true, min: 1000 })
  webhookTimeoutMs!: number;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
