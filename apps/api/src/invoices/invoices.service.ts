import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { PriceService } from '../price/price.service';
import { ChainsService } from '../chains/chains.service';
import { SettingsService } from '../settings/settings.service';
import BigNumber from 'bignumber.js';
import { Asset, Chain } from '@mintit/types';

const CHAIN_CONFIG = {
  [Chain.Xmr]: { asset: Asset.Xmr, decimals: 12, symbol: 'XMR' },
  [Chain.Firo]: { asset: Asset.Firo, decimals: 8, symbol: 'FIRO' },
} as const;

@Injectable()
export class InvoicesService {
  private readonly log = new Logger(InvoicesService.name);

  constructor(
    @InjectModel(Invoice.name)
    private readonly invoices: Model<InvoiceDocument>,
    private readonly price: PriceService,
    private readonly chains: ChainsService,
    private readonly settings: SettingsService,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    const chain = dto.chain;

    const defaultExpiry = this.settings.get(chain, 'invoiceDefaultExpirySec');
    const maxExpiry = this.settings.get(dto.chain, 'invoiceMaxExpirySec');
    const defaultConfirmations = this.settings.get(chain, 'confirmationDepth');
    const expiresIn = dto.expiresInSeconds ?? defaultExpiry;

    if (expiresIn > maxExpiry) {
      throw new BadRequestException(
        `expiresInSeconds exceeds maximum (${maxExpiry})`,
      );
    }

    const { asset, decimals, symbol } = CHAIN_CONFIG[chain];
    const fiatCurrency = (dto.fiatCurrency ?? 'USD').toUpperCase();

    let amountFiat = 0;
    let rate = 0;
    let rateLockedAt = new Date();
    try {
      const quote = await this.price.getQuote(symbol, fiatCurrency);
      const units = new BigNumber(dto.amountAtomic).dividedBy(
        new BigNumber(10).pow(decimals),
      );
      amountFiat = units.multipliedBy(quote.fiatPerAsset).toNumber();
      rate = quote.assetPerFiat;
      rateLockedAt = quote.fetchedAt;
    } catch (err) {
      this.log.warn(
        `Price lock skipped: ${(err as Error).message}. Invoice created without fiat record.`,
      );
    }

    const { address, addressIndex } = await this.chains
      .get(chain)
      .resolveAddress(`invoice:${rateLockedAt.toISOString()}`);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const created = await this.invoices.create({
      chain,
      asset,
      assetDecimals: decimals,
      address,
      addressIndex,
      amountAtomic: dto.amountAtomic,
      amountFiat,
      fiatCurrency,
      rate,
      rateLockedAt,
      expiresAt,
      confirmationsRequired: dto.confirmationsRequired ?? defaultConfirmations,
      webhookUrl: dto.webhookUrl,
      metadata: dto.metadata,
    });

    return this.toResponse(created);
  }

  async findById(id: string): Promise<InvoiceResponseDto> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Invoice not found');
    }
    const inv = await this.invoices.findById(id).exec();
    if (!inv) throw new NotFoundException('Invoice not found');
    return this.toResponse(inv);
  }

  private toResponse(inv: InvoiceDocument): InvoiceResponseDto {
    return {
      id: inv._id.toString(),
      chain: inv.chain,
      asset: inv.asset,
      assetDecimals: inv.assetDecimals,
      address: inv.address,
      addressIndex: inv.addressIndex,
      amountAtomic: inv.amountAtomic,
      amountFiat: inv.amountFiat,
      fiatCurrency: inv.fiatCurrency,
      rate: inv.rate,
      rateLockedAt: inv.rateLockedAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      status: inv.status,
      confirmationsRequired: inv.confirmationsRequired,
      confirmations: inv.confirmations,
      receivedAtomic: inv.receivedAtomic,
      firstSeenAt: inv.firstSeenAt?.toISOString(),
      paidAt: inv.paidAt?.toISOString(),
      webhookUrl: inv.webhookUrl,
      chainData: inv.chainData,
      metadata: inv.metadata,
      createdAt: (
        inv as unknown as { createdAt: Date }
      ).createdAt.toISOString(),
    };
  }
}
