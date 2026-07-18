import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '@mintit/types';

export class PublicInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatus })
  status!: InvoiceStatus;

  @ApiProperty()
  confirmations!: number;

  @ApiProperty()
  confirmationsRequired!: number;

  @ApiProperty()
  receivedAtomic!: string;
}
