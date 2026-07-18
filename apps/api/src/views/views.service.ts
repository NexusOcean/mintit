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
      amountFiat: doc.amountFiat.toFixed(2),
      fiatCurrency: doc.fiatCurrency,
      rate: doc.rate,
      rateFormatted: this.formatRate(doc.rate),
      status: doc.status,
      confirmations: doc.confirmations,
      confirmationsRequired: doc.confirmationsRequired,
      receivedAtomic: doc.receivedAtomic,
      expiresAt: this.formatDate(doc.expiresAt.toISOString()),
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

  private formatAtomic(
    atomic: string,
    decimals: number,
    ticker: string,
    displayDecimals = 5,
    minDecimals = 2,
  ): string {
    const divisor = Math.pow(10, decimals);
    const value = Number(atomic) / divisor;
    const scale = Math.pow(10, displayDecimals);
    const rounded = Math.ceil(value * scale) / scale;

    let val = rounded.toFixed(displayDecimals);
    // trim trailing zeros but stop at minDecimals
    if (val.includes('.')) {
      val = val.replace(/0+$/, '');
      const [whole, frac = ''] = val.split('.');
      val =
        frac.length < minDecimals
          ? `${whole}.${frac.padEnd(minDecimals, '0')}`
          : val.replace(/\.$/, '');
    }

    return `${val} ${ticker.toUpperCase()}`;
  }

  private formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private formatRate(rate: number): string {
    return rate.toFixed(2);
  }
}
