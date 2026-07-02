import { BadRequestException, Injectable } from '@nestjs/common';
import { IChainAdapter } from './chain-adapter.types';
import { Chain } from '@mintit/types';

@Injectable()
export class ChainsService {
  private readonly adapters = new Map<Chain, IChainAdapter>();

  register(chain: Chain, adapter: IChainAdapter): void {
    this.adapters.set(chain, adapter);
  }

  get(chain: Chain): IChainAdapter {
    const adapter = this.adapters.get(chain);
    if (!adapter) {
      throw new BadRequestException(`Chain '${chain}' is not enabled`);
    }
    return adapter;
  }

  enabledChains(): Chain[] {
    return Array.from(this.adapters.keys());
  }
}
