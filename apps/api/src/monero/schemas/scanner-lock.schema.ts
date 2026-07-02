import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ScannerLockDocument = HydratedDocument<ScannerLock>;

@Schema({ collection: 'scanner_locks', timestamps: true })
export class ScannerLock {
  @Prop({ type: String, required: true, unique: true })
  name!: string;

  @Prop({ type: String, required: true })
  owner!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;
}

export const ScannerLockSchema = SchemaFactory.createForClass(ScannerLock);
ScannerLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
