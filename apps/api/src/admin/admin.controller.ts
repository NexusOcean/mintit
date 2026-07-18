import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletInfoResponseDto } from './dto/wallet-info.dto';
import {
  InvoiceListQueryDto,
  InvoiceListResponseDto,
} from './dto/invoice-list.dto';
import { StatsResponseDto } from './dto/wallet-stats.dto';
import { Chain } from '@mintit/types';
import { PayoutDto, PayoutResponseDto } from './dto/payout.dto';
import { InvoiceResponseDto } from '../invoices/dto/invoice-response.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid Bearer token',
})
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet info' })
  @ApiQuery({ name: 'chain', enum: Chain, required: false })
  @ApiOkResponse({ type: WalletInfoResponseDto })
  getInfo(
    @Query('chain') chain: Chain = Chain.Xmr,
  ): Promise<WalletInfoResponseDto> {
    return this.admin.getWalletInfo(chain);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get stats' })
  @ApiOkResponse({ type: StatsResponseDto })
  async getStats(@Query('chain') chain: Chain): Promise<StatsResponseDto> {
    return this.admin.getStats(chain);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  @ApiOkResponse({ type: InvoiceListResponseDto })
  listInvoices(
    @Query() query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
    return this.admin.listInvoices(query);
  }

  @Get('invoices/:publicId')
  @ApiOperation({ summary: 'Get invoice by public ID' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  getInvoice(
    @Param('publicId', new ParseUUIDPipe({ version: '4' }))
    publicId: string,
  ): Promise<InvoiceResponseDto> {
    return this.admin.getInvoice(publicId);
  }

  @Post('payout')
  @ApiOperation({ summary: 'Sweep full Spark balance to address' })
  @ApiOkResponse({ type: PayoutResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid address or no spendable balance',
  })
  async payout(@Body() dto: PayoutDto): Promise<PayoutResponseDto> {
    return this.admin.payout(dto.address);
  }
}
