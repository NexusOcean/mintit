import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScannerLockService } from './scanner-lock.service';
import { ScannerLock, ScannerLockSchema } from './schemas/scanner-lock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScannerLock.name, schema: ScannerLockSchema },
    ]),
  ],
  providers: [ScannerLockService],
  exports: [ScannerLockService],
})
export class ScannerLockModule {}
