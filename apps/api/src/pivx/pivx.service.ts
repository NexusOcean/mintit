import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PIVX_CLIENT } from './pivx.constants';
import type { PivxClient } from './pivx.constants';
import { WalletInfoResponseDto } from '../admin/dto/wallet-info.dto';
import { Chain } from '@mintit/types';

@Injectable()
export class PivxService implements OnModuleInit {
  private readonly log = new Logger(PivxService.name);

  constructor(@Inject(PIVX_CLIENT) private readonly client: PivxClient) {}

  async onModuleInit(): Promise<void> {
    try {
      const height = await this.client.getBlockCount();
      this.log.debug(`PIVX RPC connected — tip height: ${height}`);
    } catch (err) {
      this.log.error(`PIVX RPC connection failed: ${(err as Error).message}`);
    }
  }

  get rpc(): PivxClient {
    return this.client;
  }

  async getNewShieldAddress(): Promise<string> {
    return await this.client.getNewShieldAddress();
  }

  async getBlockCount(): Promise<number> {
    return await this.client.getBlockCount();
  }

  async getShieldBalance(): Promise<number> {
    return await this.client.getShieldBalance();
  }

  async getWalletInfo(): Promise<WalletInfoResponseDto> {
    const [blockHeight, shieldBalance] = await Promise.all([
      this.getBlockCount(),
      this.getShieldBalance(),
    ]);
    return {
      chain: Chain.Pivx,
      blockHeight,
      availableBalance: Math.round(shieldBalance * 1e8),
    };
  }

  /** Sweeps the full shielded balance to `address`, taking the fee out of the sent amount. */
  async sweepShield(address: string, amountPiv: number): Promise<string> {
    return await this.client.shieldSendMany(
      'from_shield',
      [{ address, amount: amountPiv }],
      1,
      undefined,
      [address],
    );
  }
}
