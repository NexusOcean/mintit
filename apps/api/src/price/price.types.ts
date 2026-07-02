export interface PriceQuote {
  /** Asset per 1 unit of fiat */
  assetPerFiat: number;
  /** Fiat per 1 asset */
  fiatPerAsset: number;
  fiatCurrency: string;
  fetchedAt: Date;
  source: string;
}

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

export type { CmcQuoteResponse };
