export const RATE_PROVIDER = Symbol('RATE_PROVIDER');

export interface RateProvider {
  /** Returns units of `fiat` per 1 unit of `asset`. */
  getRate(asset: string, fiat: string): Promise<number>;
  readonly source: string;
}
