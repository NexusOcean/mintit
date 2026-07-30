import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChainsService } from '../chains/chains.service';
import { WalletInfoResponseDto } from './dto/wallet-info.dto';
import {
  InvoiceListQueryDto,
  InvoiceListResponseDto,
} from './dto/invoice-list.dto';
import { Invoice } from '../invoices/schemas/invoice.entity';
import { StatsResponseDto } from './dto/wallet-stats.dto';
import { Chain, InvoiceStatus } from '@mintit/types';
import { InvoiceResponseDto } from '../invoices/dto/invoice-response.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly chains: ChainsService,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  async getWalletInfo(chain: Chain): Promise<WalletInfoResponseDto> {
    return this.chains.get(chain).getWalletInfo();
  }

  async getStats(chain: Chain): Promise<StatsResponseDto> {
    const raw = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice."receivedAtomic"::numeric), 0)', 'total')
      .where('invoice.chain = :chain', { chain })
      .andWhere('invoice.status = :status', {
        status: InvoiceStatus.Confirmed,
      })
      .getRawOne<{ total: string }>();

    const confirmedVolumeAtomic = raw?.total ?? '0';

    const wallet = await this.chains.get(chain).getWalletInfo();

    const balance =
      chain === Chain.Firo || chain === Chain.Pivx
        ? (wallet.availableBalance ?? 0) / 1e8
        : 0;

    return { confirmedVolumeAtomic, balance };
  }

  async listInvoices(
    query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
    const { status, page = 1, limit = 20, chain = Chain.Xmr, publicId } = query;
    const where: Partial<Pick<Invoice, 'publicId' | 'chain' | 'status'>> = {};

    if (publicId) {
      where.publicId = publicId;
    } else {
      where.chain = chain;
      if (status) where.status = status;
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await this.invoiceRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = docs.map((doc) => ({
      id: doc.id,
      publicId: doc.publicId,
      chain: doc.chain,
      asset: doc.asset,
      assetDecimals: doc.assetDecimals,
      address: doc.address,
      addressIndex: doc.addressIndex,
      amountAtomic: doc.amountAtomic,
      amountFiat: doc.amountFiat,
      fiatCurrency: doc.fiatCurrency,
      rate: doc.rate,
      rateLockedAt: doc.rateLockedAt.toISOString(),
      expiresAt: doc.expiresAt.toISOString(),
      status: doc.status,
      confirmationsRequired: doc.confirmationsRequired,
      confirmations: doc.confirmations,
      receivedAtomic: doc.receivedAtomic,
      ...(doc.firstSeenAt && { firstSeenAt: doc.firstSeenAt.toISOString() }),
      ...(doc.paidAt && { paidAt: doc.paidAt.toISOString() }),
      ...(doc.webhookUrl && { webhookUrl: doc.webhookUrl }),
      ...(doc.chainData && { chainData: doc.chainData }),
      ...(doc.metadata && { metadata: doc.metadata }),
      createdAt: doc.createdAt.toISOString(),
    }));

    return { data, total, page, limit };
  }

  async getInvoice(publicId: string): Promise<InvoiceResponseDto> {
    const doc = await this.invoiceRepo.findOne({ where: { publicId } });

    if (!doc) {
      throw new BadRequestException('Invoice not found');
    }

    return {
      id: doc.id,
      publicId: doc.publicId,
      chain: doc.chain,
      asset: doc.asset,
      assetDecimals: doc.assetDecimals,
      address: doc.address,
      addressIndex: doc.addressIndex,
      amountAtomic: doc.amountAtomic,
      amountFiat: doc.amountFiat,
      fiatCurrency: doc.fiatCurrency,
      rate: doc.rate,
      rateLockedAt: doc.rateLockedAt.toISOString(),
      expiresAt: doc.expiresAt.toISOString(),
      status: doc.status,
      confirmationsRequired: doc.confirmationsRequired,
      confirmations: doc.confirmations,
      receivedAtomic: doc.receivedAtomic,
      ...(doc.firstSeenAt && { firstSeenAt: doc.firstSeenAt.toISOString() }),
      ...(doc.paidAt && { paidAt: doc.paidAt.toISOString() }),
      ...(doc.webhookUrl && { webhookUrl: doc.webhookUrl }),
      ...(doc.chainData && { chainData: doc.chainData }),
      ...(doc.metadata && { metadata: doc.metadata }),
      createdAt: doc.createdAt.toISOString(),
    };
  }

  private static readonly PAYOUT_ADDRESS_PATTERNS: Partial<
    Record<Chain, RegExp>
  > = {
    [Chain.Firo]: /^([a-zA-Z34][1-9A-HJ-NP-Za-km-z]{25,40}|sm1[a-z0-9]{50,})$/,
    [Chain.Pivx]: /^(D[1-9A-HJ-NP-Za-km-z]{25,40}|ps1[a-z0-9]{50,})$/,
  };

  async payout(address: string, chain: Chain): Promise<{ txid: string }> {
    const pattern = AdminService.PAYOUT_ADDRESS_PATTERNS[chain];
    if (!pattern || !pattern.test(address)) {
      throw new BadRequestException('Invalid address');
    }

    const adapter = this.chains.get(chain);
    if (!adapter.getSparkBalance || !adapter.spendSpark) {
      throw new BadRequestException('Payout not supported for this chain');
    }

    const balance = await adapter.getSparkBalance();
    if (balance.availableBalance === 0) {
      throw new BadRequestException('No spendable balance');
    }

    const amount = balance.availableBalance / 1e8;
    const txid = await adapter.spendSpark(address, amount);
    return { txid };
  }
}
