import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChainsService } from '../chains/chains.service';
import { WalletInfoResponseDto } from './dto/wallet-info.dto';
import {
  InvoiceListQueryDto,
  InvoiceListResponseDto,
} from './dto/invoice-list.dto';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema';
import { StatsResponseDto } from './dto/wallet-stats.dto';
import { Chain } from '@mintit/types';
import { InvoiceResponseDto } from '../invoices/dto/invoice-response.dto';

type LeanInvoice = Invoice & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly chains: ChainsService,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async getWalletInfo(chain: Chain): Promise<WalletInfoResponseDto> {
    return this.chains.get(chain).getWalletInfo();
  }

  async getStats(chain: Chain): Promise<StatsResponseDto> {
    const [volumeResult] = await this.invoiceModel.aggregate([
      { $match: { chain, status: 'confirmed' } },
      {
        $group: { _id: null, total: { $sum: { $toLong: '$receivedAtomic' } } },
      },
    ]);

    const confirmedVolumeAtomic = volumeResult
      ? String(volumeResult.total)
      : '0';

    const wallet = await this.chains.get(chain).getWalletInfo();
    const balance =
      chain === Chain.Firo ? (wallet.availableBalance ?? 0) / 1e8 : 0;

    return { confirmedVolumeAtomic, balance };
  }

  async listInvoices(
    query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
    const { status, page = 1, limit = 20, chain = Chain.Xmr } = query;
    const filter: Record<string, unknown> = { chain };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanInvoice[]>()
        .exec(),
      this.invoiceModel.countDocuments(filter),
    ]);

    const data = docs.map((doc) => ({
      id: doc._id.toString(),
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

  async getInvoice(id: string): Promise<InvoiceResponseDto> {
    const doc = await this.invoiceModel
      .findById({
        _id: new Types.ObjectId(id),
      })
      .lean<LeanInvoice>();

    if (!doc) {
      throw new BadRequestException('Invoice not found');
    }

    return {
      id: doc._id.toString(),
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

  async payout(address: string): Promise<{ txid: string }> {
    const isTransparent = /^[a-zA-Z34][1-9A-HJ-NP-Za-km-z]{25,40}$/.test(
      address,
    );
    const isSpark = /^sm1[a-z0-9]{100,}$/.test(address);
    if (!isTransparent && !isSpark) {
      throw new BadRequestException('Invalid address');
    }

    const adapter = this.chains.get(Chain.Firo);
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
