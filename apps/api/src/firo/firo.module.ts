import {
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { createFiroRpcClient } from '@nexusocean/firo-rpc';
import { FIRO_CLIENT, FiroClient } from './firo.constants';
import { FiroService } from './firo.service';
import { FiroScannerService } from './firo-scanner.service';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ScannerLockModule } from '../scanner/scanner-lock.module';
import { SettingsModule } from '../settings/settings.module';
import { FiroAdapter } from '../chains/firo-adapter';
import { ChainsService } from '../chains/chains.service';
import type { EnvironmentVariables } from '../config/env.validation';
import { Chain } from '@mintit/types';

const INTERVAL_NAME = 'firo-payment-scanner-tick';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    ScannerLockModule,
    WebhooksModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: FIRO_CLIENT,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): FiroClient =>
        createFiroRpcClient({
          host: config.get('FIRO_RPC_HOST', { infer: true }),
          port: config.get('FIRO_RPC_PORT', { infer: true }),
          user: config.get('FIRO_RPC_USER', { infer: true }),
          pass: config.get('FIRO_RPC_PASS', { infer: true }),
          protocol: config.get('FIRO_RPC_PROTOCOL', { infer: true }),
        }),
    },
    FiroService,
    FiroScannerService,
    FiroAdapter,
  ],
})
export class FiroModule implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly scanner: FiroScannerService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly chainsService: ChainsService,
    private readonly firoAdapter: FiroAdapter,
  ) {}

  onApplicationBootstrap(): void {
    this.chainsService.register(Chain.Firo, this.firoAdapter);

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
