import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Chain } from '@mintit/types';

export class PayoutDto {
  @ApiProperty({ example: 'sm1wp...' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ enum: Chain, example: Chain.Firo })
  @IsEnum(Chain)
  @IsOptional()
  chain?: Chain;
}
export class PayoutResponseDto {
  @ApiProperty({ example: 'aee3b507ef84950062776442942668b6...' })
  txid: string;
}
