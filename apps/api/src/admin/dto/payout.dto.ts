import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Chain } from '@mintit/types';

export class PayoutDto {
  @ApiProperty({ example: 'sm1wp...' })
  @IsString()
  address: string;

  @ApiProperty({ enum: Chain, example: Chain.Firo })
  @IsEnum(Chain)
  chain: Chain;
}
export class PayoutResponseDto {
  @ApiProperty({ example: 'aee3b507ef84950062776442942668b6...' })
  txid: string;
}
