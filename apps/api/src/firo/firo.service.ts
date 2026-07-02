import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FIRO_CLIENT } from './firo.constants';
import type { FiroClient } from './firo.constants';
import { WalletInfoResponseDto } from '../admin/dto/wallet-info.dto';
import { Chain } from '@mintit/types';

@Injectable()
export class FiroService implements OnModuleInit {
  private readonly log = new Logger(FiroService.name);

  constructor(@Inject(FIRO_CLIENT) private readonly client: FiroClient) {}

  async onModuleInit(): Promise<void> {
    try {
      const height = await this.client.getBlockCount();
      this.log.debug(`Firo RPC connected — tip height: ${height}`);
    } catch (err) {
      this.log.error(`Firo RPC connection failed: ${(err as Error).message}`);
    }
  }

  get rpc(): FiroClient {
    return this.client;
  }

  async getNewSparkAddress(): Promise<string> {
    const addresses = await this.client.getNewSparkAddress();
    return addresses[0];
  }

  async getBlockCount(): Promise<number> {
    return await this.client.getBlockCount();
  }

  async getBlockHash(height: number): Promise<string> {
    return await this.client.getBlockHash(height);
  }

  async getBlockWithChainlock(hash: string): Promise<{
    hash: string;
    height: number;
    confirmations: number;
    chainlock?: boolean;
    time: number;
    tx: string[];
  }> {
    return await this.client.call('getblock', hash, 1);
  }

  async dumpHdInfo(): Promise<{
    mnemonic: string;
    mnemonicpassphrase?: string;
    hdseed: string;
  }> {
    return await this.client.call('dumphdinfo');
  }

  async getWalletInfo(): Promise<WalletInfoResponseDto> {
    const [blockHeight, walletInfo, sparkBalance] = await Promise.all([
      this.getBlockCount(),
      this.client.getWalletInfo(),
      this.getSparkBalance(),
    ]);
    return {
      chain: Chain.Firo,
      blockHeight,
      availableBalance: sparkBalance.availableBalance,
      unconfirmedBalance: sparkBalance.unconfirmedBalance,
      hdMasterKeyId: walletInfo.hdmasterkeyid,
      keypoolSize: walletInfo.keypoolsize,
    };
  }

  async getSparkBalance(): Promise<{
    availableBalance: number;
    unconfirmedBalance: number;
    fullBalance: number;
  }> {
    return await this.client.getSparkBalance();
  }

  async spendSpark(address: string, amount: number): Promise<string> {
    return await this.client.sendSpark({
      [address]: { amount, subtractFee: true },
    });
  }
}
