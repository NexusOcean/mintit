import { Injectable } from '@nestjs/common';
import { FiroService } from '../firo/firo.service';
import { IChainAdapter } from './chain-adapter.types';
import { WalletInfoResponseDto } from '../admin/dto/wallet-info.dto';

@Injectable()
export class FiroAdapter implements IChainAdapter {
  constructor(private readonly firo: FiroService) {}

  async resolveAddress(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _label: string,
  ): Promise<{ address: string; addressIndex: number }> {
    const address = await this.firo.getNewSparkAddress();
    return { address, addressIndex: 0 };
  }

  async getWalletHeight(): Promise<number> {
    return this.firo.getBlockCount();
  }

  async getDaemonHeight(): Promise<number> {
    return this.firo.getBlockCount();
  }

  isSynced(): boolean {
    return true;
  }

  async healthCheck(): Promise<
    Record<string, { ok: boolean; detail?: string }>
  > {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      const height = await this.firo.getBlockCount();
      checks.node = { ok: true, detail: `height=${height}` };
    } catch (err) {
      checks.node = { ok: false, detail: (err as Error).message };
    }

    return checks;
  }

  async getWalletInfo(): Promise<WalletInfoResponseDto> {
    return this.firo.getWalletInfo();
  }

  async getSparkBalance(): Promise<{
    availableBalance: number;
    unconfirmedBalance: number;
    fullBalance: number;
  }> {
    return await this.firo.getSparkBalance();
  }

  async spendSpark(address: string, amount: number): Promise<string> {
    return await this.firo.spendSpark(address, amount);
  }
}
