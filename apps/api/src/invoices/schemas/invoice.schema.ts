import { Asset, Chain, InvoiceStatus } from '@mintit/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { randomUUID } from 'node:crypto';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ collection: 'invoices', timestamps: true })
export class Invoice {
  @Prop({
    type: String,
    required: true,
    default: () => randomUUID(),
    unique: true,
    index: true,
  })
  publicId!: string;

  @Prop({ type: String, enum: Chain, required: true, index: true })
  chain!: Chain;

  @Prop({ type: String, enum: Asset, required: true, index: true })
  asset!: Asset;

  @Prop({ type: Number, required: true })
  assetDecimals!: number;

  @Prop({ required: true, index: true })
  address!: string;

  @Prop({ type: Number, required: true })
  addressIndex!: number;

  @Prop({ type: String, required: true })
  amountAtomic!: string;

  @Prop({ type: Number, required: true })
  amountFiat!: number;

  @Prop({ type: String, required: true })
  fiatCurrency!: string;

  @Prop({ type: Number, required: true })
  rate!: number;

  @Prop({ type: Date, required: true })
  rateLockedAt!: Date;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.Pending,
    index: true,
  })
  status!: InvoiceStatus;

  @Prop({ type: Number, required: true })
  confirmationsRequired!: number;

  @Prop({ type: Number, default: 0 })
  confirmations!: number;

  @Prop({ type: String, default: '0' })
  receivedAtomic!: string;

  @Prop({ type: Date })
  firstSeenAt?: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: String })
  webhookUrl?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  chainData?: Record<string, unknown>;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ chain: 1, address: 1 });
InvoiceSchema.index({ chain: 1, status: 1 });
