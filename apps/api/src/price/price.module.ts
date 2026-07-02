import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  RateProvider as RateProviderEnv,
  type EnvironmentVariables,
} from '../config/env.validation';
import { SettingsModule } from '../settings/settings.module';
import { PriceService } from './price.service';
import { CmcRateProvider } from './providers/cmc.provider';
import { RATE_PROVIDER, type RateProvider } from './rate-provider.interface';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({ timeout: 8_000, maxRedirects: 2 }),
    }),
    SettingsModule,
  ],
  providers: [
    PriceService,
    CmcRateProvider,
    {
      provide: RATE_PROVIDER,
      inject: [ConfigService, CmcRateProvider],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        cmc: CmcRateProvider,
      ): RateProvider => {
        const selected = config.get('RATE_PROVIDER', { infer: true });
        switch (selected) {
          case RateProviderEnv.Cmc:
            return cmc;
          default: {
            const exhaustive: never = selected;
            throw new Error(
              `Unsupported rate provider: ${exhaustive as string}`,
            );
          }
        }
      },
    },
  ],
  exports: [PriceService],
})
export class PriceModule {}
