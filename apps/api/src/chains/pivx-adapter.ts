import { Injectable } from '@nestjs/common';
import { PivxService } from '../pivx/pivx.service';
import { IChainAdapter } from './chain-adapter.types';
import { WalletInfoResponseDto } from '../admin/dto/wallet-info.dto';

@Injectable()
export class PivxAdapter implements IChainAdapter {
  constructor(private readonly pivx: PivxService) {}

  async resolveAddress(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _label: string,
  ): Promise<{ address: string; addressIndex: number }> {
    const address = await this.pivx.getNewShieldAddress();
    return { address, addressIndex: 0 };
  }

  async getWalletHeight(): Promise<number> {
    return this.pivx.getBlockCount();
  }

  async getDaemonHeight(): Promise<number> {
    return this.pivx.getBlockCount();
  }

  isSynced(): boolean {
    return true;
  }

  async healthCheck(): Promise<
    Record<string, { ok: boolean; detail?: string }>
  > {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      const height = await this.pivx.getBlockCount();
      checks.node = { ok: true, detail: `height=${height}` };
    } catch (err) {
      checks.node = { ok: false, detail: (err as Error).message };
    }

    return checks;
  }

  async getWalletInfo(): Promise<WalletInfoResponseDto> {
    return this.pivx.getWalletInfo();
  }

  async getSparkBalance(): Promise<{
    availableBalance: number;
    unconfirmedBalance: number;
    fullBalance: number;
  }> {
    const shieldBalance = await this.pivx.getShieldBalance();
    const atomic = Math.round(shieldBalance * 1e8);
    return {
      availableBalance: atomic,
      unconfirmedBalance: 0,
      fullBalance: atomic,
    };
  }

  async spendSpark(address: string, amount: number): Promise<string> {
    return await this.pivx.sweepShield(address, amount);
  }
}
