import { Chain } from '@mintit/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ collection: 'payments', timestamps: true })
export class Payment {
  @Prop({ type: String, enum: Chain, required: true, index: true })
  chain!: Chain;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true, index: true })
  invoiceId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  address!: string;

  @Prop({ type: Number, required: true, index: true })
  addressIndex!: number;

  @Prop({ type: String, required: true })
  txHash!: string;

  @Prop({ type: String, required: true })
  amountAtomic!: string;

  @Prop({ type: Number, default: 0 })
  confirmations!: number;

  @Prop({ type: Boolean, default: false })
  unlocked!: boolean;

  @Prop({ type: Number })
  blockHeight?: number;

  @Prop({ type: Date, required: true })
  firstSeenAt!: Date;

  @Prop({ type: Date })
  confirmedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ chain: 1, txHash: 1, addressIndex: 1 }, { unique: true });
