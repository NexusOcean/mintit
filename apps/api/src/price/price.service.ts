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

@Injectable()
export class PriceService {
  private readonly log = new Logger(PriceService.name);
  private cache = new Map<string, PriceQuote>();

  constructor(
    @Inject(RATE_PROVIDER) private readonly providers: RateProvider[],
    private readonly settings: SettingsService,
  ) {}

  async getQuote(
    assetSymbol: string,
    fiatCurrency: string,
  ): Promise<PriceQuote> {
    const asset = assetSymbol.toUpperCase();
    const fiat = fiatCurrency.toUpperCase();
    const key = `${asset}:${fiat}`;
    const { rateCacheTtlMs } = this.settings.getGlobal();
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.fetchedAt.getTime() < rateCacheTtlMs) {
      return cached;
    }

    for (const provider of this.providers) {
      try {
        const fiatPerAsset = await provider.getRate(asset, fiat);
        const assetPerFiat = new BigNumber(1)
          .dividedBy(fiatPerAsset)
          .toNumber();
        const fresh: PriceQuote = {
          fiatPerAsset,
          assetPerFiat,
          fiatCurrency: fiat,
          fetchedAt: new Date(),
          source: provider.source,
        };
        this.cache.set(key, fresh);
        return fresh;
      } catch (err) {
        this.log.warn(
          `Provider ${provider.source} failed for ${key}: ${(err as Error).message} — trying next`,
        );
      }
    }

    if (cached) {
      this.log.warn(`All providers failed for ${key}; serving stale quote`);
      return cached;
    }

    throw new ServiceUnavailableException('Price feed unavailable');
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
