import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { Invoice } from '../invoices/schemas/invoice.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Invoice])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
