import {
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Chain } from '@mintit/types';
import { MoneroWalletProvider } from './monero.provider';
import { MoneroService } from './monero.service';
import { MoneroScannerService } from './monero-scanner.service';
import { ScannerLockModule } from '../scanner/scanner-lock.module';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { SettingsModule } from '../settings/settings.module';
import { MoneroAdapter } from '../chains/monero-adapter';
import { ChainsService } from '../chains/chains.service';
import type { EnvironmentVariables } from '../config/env.validation';

const INTERVAL_NAME = 'xmr-payment-scanner-tick';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
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
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly chainsService: ChainsService,
    private readonly moneroAdapter: MoneroAdapter,
  ) {}

  onApplicationBootstrap(): void {
    this.chainsService.register(Chain.Xmr, this.moneroAdapter);

    const ms = this.config.get('SCANNER_INTERVAL_MS', { infer: true });
    const handle = setInterval(() => {
      void this.scanner.tick();
    }, ms);
    this.registry.addInterval(INTERVAL_NAME, handle);
  }

  onModuleDestroy(): void {
    if (this.registry.doesExist('interval', INTERVAL_NAME)) {
      this.registry.deleteInterval(INTERVAL_NAME);
    }
  }
}
