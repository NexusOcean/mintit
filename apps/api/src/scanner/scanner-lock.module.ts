import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScannerLockService } from './scanner-lock.service';
import { ScannerLock } from './schemas/scanner-lock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScannerLock])],
  providers: [ScannerLockService],
  exports: [ScannerLockService],
})
export class ScannerLockModule {}
