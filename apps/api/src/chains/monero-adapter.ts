import { Injectable } from '@nestjs/common';
import { MoneroService } from '../monero/monero.service';
import { IChainAdapter } from './chain-adapter.types';
import { WalletInfoResponseDto } from '../admin/dto/wallet-info.dto';

@Injectable()
export class MoneroAdapter implements IChainAdapter {
  constructor(private readonly monero: MoneroService) {}

  async resolveAddress(
    label: string,
  ): Promise<{ address: string; addressIndex: number }> {
    const sub = await this.monero.createSubaddress(label);
    return { address: sub.address, addressIndex: sub.index };
  }

  async getWalletHeight(): Promise<number> {
    return this.monero.getHeight();
  }

  async getDaemonHeight(): Promise<number> {
    return this.monero.getDaemonHeight();
  }

  async isSynced(): Promise<boolean> {
    return this.monero.isSynced();
  }

  async healthCheck(): Promise<
    Record<string, { ok: boolean; detail?: string }>
  > {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      const height = await this.monero.getHeight();
      checks.wallet = { ok: true, detail: `height=${height}` };
    } catch (err) {
      checks.wallet = { ok: false, detail: (err as Error).message };
    }

    try {
      const conn = await this.monero.getClient().getDaemonConnection();
      const isOnline = conn?.getIsOnline?.() ?? true;
      checks.daemon = { ok: isOnline, detail: conn?.getUri?.() ?? 'unknown' };
    } catch (err) {
      checks.daemon = { ok: false, detail: (err as Error).message };
    }

    return checks;
  }

  async getWalletInfo(): Promise<WalletInfoResponseDto> {
    return this.monero.getWalletInfo();
  }
}
