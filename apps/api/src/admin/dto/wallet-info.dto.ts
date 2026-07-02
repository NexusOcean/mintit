import { Chain } from '@mintit/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletInfoResponseDto {
  @ApiProperty({ enum: Chain, example: Chain.Xmr })
  chain!: Chain;

  // XMR fields
  @ApiPropertyOptional({ example: '5A1...' })
  primaryAddress?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3...64hex',
    description: 'Private view key (read-only; cannot spend funds)',
  })
  viewKey?: string;

  @ApiPropertyOptional({ example: 1234567 })
  restoreHeight?: number;

  @ApiPropertyOptional({ example: 1234890 })
  walletHeight?: number;

  @ApiPropertyOptional({ example: 1234892 })
  daemonHeight?: number;

  @ApiPropertyOptional({ example: true })
  synced?: boolean;

  // Firo fields
  @ApiPropertyOptional({ example: 1322631 })
  blockHeight?: number;

  @ApiPropertyOptional({ example: 100000000 })
  availableBalance?: number;

  @ApiPropertyOptional({ example: 0 })
  unconfirmedBalance?: number;

  @ApiPropertyOptional({ example: 'fdec8781a3c6357dd808379283238a9e649ab5dd' })
  hdMasterKeyId?: string;

  @ApiPropertyOptional({ example: 100 })
  keypoolSize?: number;
}
