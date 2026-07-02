import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createWalletFull,
  openWalletFull,
  MoneroNetworkType,
  type MoneroWalletFull,
} from 'monero-ts';
import {
  MoneroNetwork,
  type EnvironmentVariables,
} from '../config/env.validation';
import { MONERO_WALLET } from './monero.constants';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const toNetworkType = (n: MoneroNetwork): MoneroNetworkType =>
  n === MoneroNetwork.Mainnet
    ? MoneroNetworkType.MAINNET
    : MoneroNetworkType.STAGENET;

export const MoneroWalletProvider: Provider = {
  provide: MONERO_WALLET,
  inject: [ConfigService],
  useFactory: async (
    config: ConfigService<EnvironmentVariables, true>,
  ): Promise<MoneroWalletFull> => {
    const logger = new Logger('MoneroWalletProvider');

    const path = config.get('MONERO_WALLET_PATH', { infer: true });
    const networkType = toNetworkType(
      config.get('MONERO_NETWORK', { infer: true }),
    );
    const server = {
      uri: config.get('MONERO_DAEMON_URI', { infer: true }),
      username: config.get('MONERO_DAEMON_USER', { infer: true }),
      password: config.get('MONERO_DAEMON_PASSWORD', { infer: true }),
      rejectUnauthorized: false,
    };

    mkdirSync(dirname(path), { recursive: true });

    // Branch 1: open existing wallet file
    if (existsSync(path)) {
      logger.log(`Opening existing view-only wallet at ${path}`);
      const wallet = await openWalletFull({
        path,
        password: '',
        networkType,
        server,
      });
      return wallet;
    }

    // Branch 2: create view-only from supplied keys
    const privateViewKey = config.get('MONERO_VIEW_KEY', { infer: true });
    const primaryAddress = config.get('MONERO_PRIMARY_ADDRESS', {
      infer: true,
    });
    const restoreHeight = config.get('MONERO_RESTORE_HEIGHT', { infer: true });

    if (!privateViewKey || !primaryAddress || restoreHeight === undefined) {
      throw new Error(
        `No wallet file at "${path}" and missing one or more of ` +
          'MONERO_VIEW_KEY, MONERO_PRIMARY_ADDRESS, MONERO_RESTORE_HEIGHT. ' +
          'Cannot boot view-only wallet.',
      );
    }

    logger.log(
      `Creating view-only wallet at ${path} (restore height ${restoreHeight})`,
    );
    const wallet = await createWalletFull({
      path,
      password: '',
      networkType,
      server,
      primaryAddress,
      privateViewKey,
      restoreHeight,
    });
    await wallet.save();
    return wallet;
  },
};
