import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { Invoice } from '../invoices/schemas/invoice.entity';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Invoice]), InvoicesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
