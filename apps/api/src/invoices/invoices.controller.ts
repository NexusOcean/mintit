import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiServiceUnavailableResponse,
  ApiParam,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@ApiTags('invoices')
@ApiSecurity('api-key')
@ApiUnauthorizedResponse({ description: 'Missing or invalid X-Api-Key header' })
@Controller('invoices')
@UseGuards(ApiKeyGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create invoice',
    description:
      'Generates a unique XMR subaddress, locks the XMR/fiat rate, and returns the invoice. Expiry timer freezes once an incoming tx is detected.',
  })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation error or expiry exceeds maximum',
  })
  @ApiServiceUnavailableResponse({ description: 'Price feed unavailable' })
  create(@Body() dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    return this.invoices.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by id' })
  @ApiParam({ name: 'id', example: '6630f0c8a1b2c3d4e5f6a7b8' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  findOne(@Param('id') id: string): Promise<InvoiceResponseDto> {
    return this.invoices.findById(id);
  }
}
