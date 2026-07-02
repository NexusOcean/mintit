import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  ScannerLock,
  ScannerLockDocument,
} from './schemas/scanner-lock.schema';

/**
 * Mongo-backed advisory lock. Use to prevent concurrent scanner runs across
 * instances or overlapping cron ticks within a single instance.
 */
@Injectable()
export class ScannerLockService {
  private readonly owner = randomUUID();

  constructor(
    @InjectModel(ScannerLock.name)
    private readonly model: Model<ScannerLockDocument>,
  ) {}

  /** Acquire lock for `name` with `ttlMs`. Returns true if acquired. */
  async acquire(name: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    try {
      const doc = await this.model.findOneAndUpdate(
        {
          name,
          $or: [
            { expiresAt: { $lte: now } },
            { expiresAt: { $exists: false } },
          ],
        },
        { $set: { name, owner: this.owner, expiresAt } },
        { upsert: true, returnDocument: 'after' },
      );
      return doc?.owner === this.owner;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return false;
      throw err;
    }
  }

  async release(name: string): Promise<void> {
    await this.model.deleteOne({ name, owner: this.owner }).exec();
  }
}
