import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PayoutDto {
  @ApiProperty({ example: 'sm1wp...' })
  @IsString()
  address: string;
}
export class PayoutResponseDto {
  @ApiProperty({ example: 'aee3b507ef84950062776442942668b6...' })
  txid: string;
}
