import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema';
import { PublicInvoiceResponseDto } from './dto/invoice.dto';
import { PublicInvoiceStatusDto } from './dto/status.dto';

@Injectable()
export class ViewsService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  private formatAtomic(
    atomic: string,
    decimals: number,
    ticker: string,
  ): string {
    const divisor = Math.pow(10, decimals);
    const val = (Number(atomic) / divisor)
      .toFixed(decimals)
      .replace(/\.?0+$/, '');
    return `${val} ${ticker.toUpperCase()}`;
  }

  async getInvoice(publicId: string): Promise<PublicInvoiceResponseDto | null> {
    const doc = await this.invoiceModel.findOne({ publicId }).lean();
    if (!doc) return null;

    return {
      publicId: doc.publicId,
      chain: doc.chain,
      asset: doc.asset,
      assetDecimals: doc.assetDecimals,
      address: doc.address,
      amountAtomic: doc.amountAtomic,
      amountFormatted: this.formatAtomic(
        doc.amountAtomic,
        doc.assetDecimals,
        doc.asset,
      ),
      amountFiat: doc.amountFiat,
      fiatCurrency: doc.fiatCurrency,
      rate: doc.rate,
      status: doc.status,
      confirmations: doc.confirmations,
      confirmationsRequired: doc.confirmationsRequired,
      receivedAtomic: doc.receivedAtomic,
      expiresAt: doc.expiresAt.toISOString(),
    };
  }

  async getStatus(publicId: string): Promise<PublicInvoiceStatusDto | null> {
    const doc = await this.invoiceModel
      .findOne({ publicId })
      .select('status confirmations confirmationsRequired receivedAtomic')
      .lean();
    if (!doc) return null;

    return {
      status: doc.status,
      confirmations: doc.confirmations,
      confirmationsRequired: doc.confirmationsRequired,
      receivedAtomic: doc.receivedAtomic,
    };
  }
}
