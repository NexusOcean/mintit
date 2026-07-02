import { Chain } from '@mintit/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum WebhookEvent {
  InvoiceSeen = 'invoice.seen',
  InvoiceConfirmed = 'invoice.confirmed',
  InvoiceUnderpaid = 'invoice.underpaid',
  InvoiceExpired = 'invoice.expired',
}

export enum WebhookDeliveryStatus {
  Pending = 'pending',
  Delivered = 'delivered',
  Failed = 'failed',
  DeadLettered = 'dead_lettered',
}

export type WebhookDeliveryDocument = HydratedDocument<WebhookDelivery>;

@Schema({ collection: 'webhook_deliveries', timestamps: true })
export class WebhookDelivery {
  @Prop({ type: String, enum: Chain, required: true, index: true })
  chain!: Chain;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true, index: true })
  invoiceId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: String, enum: WebhookEvent, required: true })
  event!: WebhookEvent;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload!: Record<string, unknown>;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: Date, required: true, index: true })
  nextAttemptAt!: Date;

  @Prop({
    type: String,
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.Pending,
    index: true,
  })
  status!: WebhookDeliveryStatus;

  @Prop({ type: Number })
  lastResponseCode?: number;

  @Prop({ type: String })
  lastError?: string;
}

export const WebhookDeliverySchema =
  SchemaFactory.createForClass(WebhookDelivery);
