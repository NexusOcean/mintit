import {
  IsOptional,
  IsString,
  IsInt,
  IsUrl,
  Length,
  Min,
  IsObject,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Chain } from '@mintit/types';

export class CreateInvoiceDto {
  @ApiProperty({
    example: Chain.Xmr,
    description: 'Chain to create the invoice on',
    enum: Chain,
  })
  @IsEnum(Chain)
  chain!: Chain;

  @ApiProperty({
    example: '123456789012',
    description:
      'Amount owed in atomic units (string, BigInt-compatible). Piconero for XMR (1 XMR = 10^12), satoshi for FIRO (1 FIRO = 10^8).',
  })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'amountAtomic must be a positive integer string',
  })
  amountAtomic!: string;

  @ApiPropertyOptional({
    example: 'USD',
    description:
      'Fiat currency to record equivalent at lock time (informational only). Defaults to USD.',
    minLength: 3,
    maxLength: 8,
  })
  @IsOptional()
  @IsString()
  @Length(3, 8)
  fiatCurrency?: string;

  @ApiPropertyOptional({
    example: 1200,
    description: 'Expiry in seconds (default 20 min)',
    minimum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  expiresInSeconds?: number;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Override confirmations required. Defaults to CONFIRMATION_DEPTH.',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  confirmationsRequired?: number;

  @ApiPropertyOptional({
    example: 'https://webhook.site/xmr/hook',
    description: 'Webhook callback URL',
  })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  webhookUrl?: string;

  @ApiPropertyOptional({
    example: { orderId: 'ORD-1234' },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
