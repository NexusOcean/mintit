import { WalletInfoResponseDto } from '../admin/dto/wallet-info.dto';
import { StatsResponseDto } from '../admin/dto/wallet-stats.dto';

export interface IChainAdapter {
  resolveAddress(
    label: string,
  ): Promise<{ address: string; addressIndex: number }>;
  getWalletHeight(): Promise<number>;
  getDaemonHeight(): Promise<number>;
  isSynced(): Promise<boolean> | boolean;
  healthCheck(): Promise<Record<string, { ok: boolean; detail?: string }>>;
  getWalletInfo(): Promise<WalletInfoResponseDto>;
  getStats?(): Promise<Partial<StatsResponseDto>>;
  getSparkBalance?(): Promise<{
    availableBalance: number;
    unconfirmedBalance: number;
    fullBalance: number;
  }>;
  spendSpark?(address: string, amount: number): Promise<string>;
}
