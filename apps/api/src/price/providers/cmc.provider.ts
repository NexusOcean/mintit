import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { EnvironmentVariables } from '../../config/env.validation';
import type { RateProvider } from '../rate-provider.interface';

interface CmcQuoteResponse {
  data: {
    [symbol: string]: Array<{
      id: number;
      symbol: string;
      quote: {
        [fiat: string]: {
          price: number;
          last_updated: string;
        };
      };
    }>;
  };
  status: {
    error_code: number;
    error_message: string | null;
  };
}

@Injectable()
export class CmcRateProvider implements RateProvider {
  readonly source = 'coinmarketcap';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async getRate(asset: string, fiat: string): Promise<number> {
    const apiKey = this.config.get('CMC_API_KEY', { infer: true });
    const baseUrl = this.config.get('CMC_BASE_URL', { infer: true });
    const url = `${baseUrl}/v2/cryptocurrency/quotes/latest`;

    const response = await firstValueFrom(
      this.http.get<CmcQuoteResponse>(url, {
        headers: { 'X-CMC_PRO_API_KEY': apiKey, Accept: 'application/json' },
        params: { symbol: asset, convert: fiat },
      }),
    );

    const body = response.data;
    if (body.status.error_code !== 0) {
      throw new Error(
        `CMC error ${body.status.error_code}: ${body.status.error_message}`,
      );
    }
    const entries = body.data?.[asset];
    if (!entries || entries.length === 0) {
      throw new Error(`${asset} not found in CMC response`);
    }
    const quote = entries[0].quote?.[fiat];
    if (!quote || typeof quote.price !== 'number' || quote.price <= 0) {
      throw new Error(`Quote for ${fiat} missing or invalid`);
    }
    return quote.price;
  }
}
