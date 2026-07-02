import { UserScope } from '@mintit/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ select: false })
  totpSecret?: string;

  @Prop({ type: [String], default: [], select: false })
  backupCodes!: string[];

  @Prop({ select: false })
  lastUsedTotp?: string;

  @Prop({
    required: true,
    type: [String],
    enum: UserScope,
    default: [UserScope.ADMIN],
  })
  scope!: UserScope[];

  @Prop({ required: true, default: false })
  isValid!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
