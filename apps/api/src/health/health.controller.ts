import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChainsService } from '../chains/chains.service';
import {
  LiveResponseDto,
  ReadyResponseDto,
  SyncedResponseDto,
  HealthCheckDto,
} from './dto/health.dto';
import { Chain } from '@mintit/types';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly chains: ChainsService,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ type: LiveResponseDto })
  live(): LiveResponseDto {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiQuery({ name: 'chain', enum: Chain, required: false })
  @ApiOkResponse({ type: ReadyResponseDto })
  async ready(
    @Query('chain') chain: Chain = Chain.Xmr,
    @Res() res: Response,
  ): Promise<void> {
    const checks: Record<string, HealthCheckDto> = {};

    checks.database = await this.checkDatabase();

    const chainChecks = await this.chains.get(chain).healthCheck();
    Object.assign(checks, chainChecks);

    const ok = Object.values(checks).every((c) => c.ok);
    const body: ReadyResponseDto = { status: ok ? 'ok' : 'degraded', checks };

    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }

  @Get('synced')
  @ApiOperation({ summary: 'Sync probe' })
  @ApiQuery({ name: 'chain', enum: Chain, required: false })
  @ApiOkResponse({ type: SyncedResponseDto })
  async synced(
    @Query('chain') chain: Chain = Chain.Xmr,
  ): Promise<SyncedResponseDto> {
    try {
      const adapter = this.chains.get(chain);
      const [walletHeight, daemonHeight, synced] = await Promise.all([
        adapter.getWalletHeight(),
        adapter.getDaemonHeight(),
        adapter.isSynced(),
      ]);
      return {
        status: synced ? 'ok' : 'syncing',
        walletHeight,
        daemonHeight,
        behind: daemonHeight - walletHeight,
      };
    } catch (err) {
      return {
        status: 'syncing',
        walletHeight: 0,
        daemonHeight: 0,
        behind: -1,
        detail: (err as Error).message,
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheckDto> {
    try {
      await this.dataSource.query('SELECT 1');
      return { ok: true };
    } catch (err) {
      return { ok: false, detail: (err as Error).message };
    }
  }
}
