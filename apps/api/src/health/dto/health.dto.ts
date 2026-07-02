import { ApiProperty } from '@nestjs/swagger';

export class LiveResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;
}

export class HealthCheckDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ required: false, example: 'height=1234567' })
  detail?: string;
}

export class ReadyResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({
    example: {
      database: { ok: true },
      wallet: { ok: true, detail: 'height=1234567' },
      daemon: { ok: true, detail: 'http://monerod:38081' },
    },
  })
  checks!: Record<string, HealthCheckDto>;
}

export class SyncedResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'syncing'] })
  status!: 'ok' | 'syncing';

  @ApiProperty({ example: 1234890 })
  walletHeight!: number;

  @ApiProperty({ example: 1234892 })
  daemonHeight!: number;

  @ApiProperty({ example: 2, description: 'daemonHeight - walletHeight' })
  behind!: number;

  @ApiProperty({ required: false })
  detail?: string;
}
