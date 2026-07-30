import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { EnvironmentVariables } from '../config/env.validation';
import { getMongoUri } from '../config/mongo-uri';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService<EnvironmentVariables, true>) => ({
        uri: await getMongoUri(config.get('MONGO_URI', { infer: true })),
        dbName: config.get('MONGO_DB_NAME', { infer: true }),
      }),
    }),
  ],
})
export class DatabaseModule {}
