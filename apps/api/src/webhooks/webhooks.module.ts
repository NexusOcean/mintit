import {
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { WebhooksService } from './webhooks.service';
import { WebhookDelivery } from './schemas/webhook-delivery.entity';
import { TUNABLE_DEFAULTS } from '../config/tunable-defaults';
import { SettingsModule } from '../settings/settings.module';

const INTERVAL_NAME = 'webhook-dispatch-tick';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({ maxRedirects: 0 }),
    TypeOrmModule.forFeature([WebhookDelivery]),
    SettingsModule,
  ],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly webhooks: WebhooksService,
  ) {}

  onApplicationBootstrap(): void {
    const handle = setInterval(() => {
      void this.webhooks.dispatchDue();
    }, TUNABLE_DEFAULTS.WEBHOOK_DISPATCH_INTERVAL_MS);
    this.registry.addInterval(INTERVAL_NAME, handle);
  }

  onModuleDestroy(): void {
    if (this.registry.doesExist('interval', INTERVAL_NAME)) {
      this.registry.deleteInterval(INTERVAL_NAME);
    }
  }
}
