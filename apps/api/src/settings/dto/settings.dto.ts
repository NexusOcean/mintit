import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SettingsResponseDto {
  @ApiProperty({ minimum: 1 })
  confirmationDepth!: number;

  @ApiProperty({ minimum: 60, description: 'Seconds' })
  invoiceDefaultExpirySec!: number;

  @ApiProperty({ minimum: 60, description: 'Seconds' })
  invoiceMaxExpirySec!: number;

  @ApiProperty({ minimum: 1000, description: 'Milliseconds' })
  scannerLockTtlMs!: number;

  @ApiProperty({ minimum: 1 })
  syncedThresholdBlocks!: number;

  @ApiProperty({ minimum: 0, description: 'Milliseconds' })
  rateCacheTtlMs!: number;

  @ApiProperty({ minimum: 1 })
  webhookMaxAttempts!: number;

  @ApiProperty({ minimum: 1000, description: 'Milliseconds' })
  webhookTimeoutMs!: number;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  confirmationDepth?: number;

  @ApiPropertyOptional({ minimum: 60 })
  @IsInt()
  @Min(60)
  @IsOptional()
  invoiceDefaultExpirySec?: number;

  @ApiPropertyOptional({ minimum: 60 })
  @IsInt()
  @Min(60)
  @IsOptional()
  invoiceMaxExpirySec?: number;

  @ApiPropertyOptional({ minimum: 1000 })
  @IsInt()
  @Min(1000)
  @IsOptional()
  scannerLockTtlMs?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  syncedThresholdBlocks?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  rateCacheTtlMs?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  webhookMaxAttempts?: number;

  @ApiPropertyOptional({ minimum: 1000 })
  @IsInt()
  @Min(1000)
  @IsOptional()
  webhookTimeoutMs?: number;
}
