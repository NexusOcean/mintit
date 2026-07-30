import {
  Module,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { WebhooksService } from './webhooks.service';
import {
  WebhookDelivery,
  WebhookDeliverySchema,
} from './schemas/webhook-delivery.schema';
import { TUNABLE_DEFAULTS } from '../config/tunable-defaults';
import { SettingsModule } from '../settings/settings.module';

const INTERVAL_NAME = 'webhook-dispatch-tick';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({ maxRedirects: 0 }),
    MongooseModule.forFeature([
      { name: WebhookDelivery.name, schema: WebhookDeliverySchema },
    ]),
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
