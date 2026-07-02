import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StatsResponseDto {
  @ApiProperty({
    example: '500000000',
    description: 'Total confirmed volume in atomic units',
  })
  confirmedVolumeAtomic!: string;

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Wallet balance (Firo only)',
  })
  balance?: number;
}
