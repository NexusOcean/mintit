import {
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Chain } from '@mintit/types';
import { MoneroWalletProvider } from './monero.provider';
import { MoneroService } from './monero.service';
import { MoneroScannerService } from './monero-scanner.service';
import { ScannerLockModule } from '../scanner/scanner-lock.module';
import { Invoice } from '../invoices/schemas/invoice.entity';
import { Payment } from '../payments/schemas/payment.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { SettingsModule } from '../settings/settings.module';
import { MoneroAdapter } from '../chains/monero-adapter';
import { ChainsService } from '../chains/chains.service';
import { TUNABLE_DEFAULTS } from '../config/tunable-defaults';

const INTERVAL_NAME = 'xmr-payment-scanner-tick';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Payment]),
    ScannerLockModule,
    WebhooksModule,
    SettingsModule,
  ],
  providers: [
    MoneroWalletProvider,
    MoneroService,
    MoneroScannerService,
    MoneroAdapter,
  ],
  exports: [MoneroService],
})
export class MoneroModule implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly scanner: MoneroScannerService,
    private readonly chainsService: ChainsService,
    private readonly moneroAdapter: MoneroAdapter,
  ) {}

  onApplicationBootstrap(): void {
    this.chainsService.register(Chain.Xmr, this.moneroAdapter);

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
