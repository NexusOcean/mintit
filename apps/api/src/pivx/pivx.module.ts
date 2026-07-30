import {
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PivxClient as PivxRpcClient } from 'pivx-rpc';
import { PIVX_CLIENT, PivxClient } from './pivx.constants';
import { PivxService } from './pivx.service';
import { PivxScannerService } from './pivx-scanner.service';
import { Invoice } from '../invoices/schemas/invoice.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ScannerLockModule } from '../scanner/scanner-lock.module';
import { SettingsModule } from '../settings/settings.module';
import { PivxAdapter } from '../chains/pivx-adapter';
import { ChainsService } from '../chains/chains.service';
import type { EnvironmentVariables } from '../config/env.validation';
import { TUNABLE_DEFAULTS } from '../config/tunable-defaults';
import { Chain } from '@mintit/types';

const INTERVAL_NAME = 'pivx-payment-scanner-tick';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    ScannerLockModule,
    WebhooksModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: PIVX_CLIENT,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): PivxClient => {
        const protocol = config.get('PIVX_RPC_PROTOCOL', { infer: true });
        const host = config.get('PIVX_RPC_HOST', { infer: true });
        const port = config.get('PIVX_RPC_PORT', { infer: true });
        return new PivxRpcClient({
          url: `${protocol}://${host}:${port}`,
          user: config.get('PIVX_RPC_USER', { infer: true }),
          pass: config.get('PIVX_RPC_PASS', { infer: true }),
        });
      },
    },
    PivxService,
    PivxScannerService,
    PivxAdapter,
  ],
})
export class PivxModule implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly scanner: PivxScannerService,
    private readonly chainsService: ChainsService,
    private readonly pivxAdapter: PivxAdapter,
  ) {}

  onApplicationBootstrap(): void {
    this.chainsService.register(Chain.Pivx, this.pivxAdapter);

    const handle = setInterval(() => {
      void this.scanner.tick();
    }, TUNABLE_DEFAULTS.SCANNER_INTERVAL_MS);
    this.registry.addInterval(INTERVAL_NAME, handle);
  }

  onModuleDestroy(): void {
    if (this.registry.doesExist('interval', INTERVAL_NAME)) {
      this.registry.deleteInterval(INTERVAL_NAME);
    }
  }
}
