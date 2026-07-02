import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { SettingsService } from '../settings/settings.service';
import { RATE_PROVIDER, type RateProvider } from './rate-provider.interface';
import type { PriceQuote } from './price.types';
import { Chain } from '@mintit/types';

@Injectable()
export class PriceService {
  private readonly log = new Logger(PriceService.name);
  private cache = new Map<string, PriceQuote>();

  constructor(
    @Inject(RATE_PROVIDER) private readonly rates: RateProvider,
    private readonly settings: SettingsService,
  ) {}

  async getQuote(
    assetSymbol: string,
    fiatCurrency: string,
  ): Promise<PriceQuote> {
    const key = `${assetSymbol.toUpperCase()}:${fiatCurrency.toUpperCase()}`;
    const ttl = this.settings.get(Chain.Xmr, 'rateCacheTtlMs');
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt.getTime() < ttl) {
      return cached;
    }

    try {
      const fiatPerAsset = await this.rates.getRate(
        assetSymbol.toUpperCase(),
        fiatCurrency.toUpperCase(),
      );
      const assetPerFiat = new BigNumber(1).dividedBy(fiatPerAsset).toNumber();
      const fresh: PriceQuote = {
        fiatPerAsset,
        assetPerFiat,
        fiatCurrency: fiatCurrency.toUpperCase(),
        fetchedAt: new Date(),
        source: this.rates.source,
      };
      this.cache.set(key, fresh);
      return fresh;
    } catch (err) {
      if (cached) {
        this.log.warn(
          `Rate fetch failed (${(err as Error).message}); serving stale quote for ${key}`,
        );
        return cached;
      }
      throw new ServiceUnavailableException('Price feed unavailable');
    }
  }

  convertFiatToAtomic(
    amountFiat: number | string,
    quote: PriceQuote,
    decimals: number,
  ): string {
    const amount = new BigNumber(amountFiat);
    if (amount.isNaN() || amount.isLessThanOrEqualTo(0)) {
      throw new Error('amountFiat must be > 0');
    }
    const atomic = amount
      .multipliedBy(new BigNumber(quote.assetPerFiat))
      .multipliedBy(new BigNumber(10).pow(decimals))
      .integerValue(BigNumber.ROUND_UP);
    return atomic.toFixed(0);
  }
}
