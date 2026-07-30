import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';
import { ViewsService } from './views.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { Invoice } from '../invoices/schemas/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 25 }],
    }),
  ],
  controllers: [ViewsController],
  providers: [ViewsService],
})
export class ViewsModule {}
