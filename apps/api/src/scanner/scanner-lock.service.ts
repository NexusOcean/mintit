import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ScannerLock } from './schemas/scanner-lock.entity';

/**
 * Postgres-backed advisory lock. Use to prevent concurrent scanner runs
 * across instances or overlapping cron ticks within a single instance.
 */
@Injectable()
export class ScannerLockService {
  private readonly owner = randomUUID();

  constructor(
    @InjectRepository(ScannerLock)
    private readonly repo: Repository<ScannerLock>,
  ) {}

  /** Acquire lock for `name` with `ttlMs`. Returns true if acquired. */
  async acquire(name: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    const result = await this.repo.query(
      `INSERT INTO scanner_locks (name, owner, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (name) DO UPDATE
         SET owner = $2, "expiresAt" = $3, "updatedAt" = now()
         WHERE scanner_locks."expiresAt" <= $4
       RETURNING owner`,
      [name, this.owner, expiresAt, now],
    );

    return result.length === 1 && result[0].owner === this.owner;
  }

  async release(name: string): Promise<void> {
    await this.repo.delete({ name, owner: this.owner });
  }
}
