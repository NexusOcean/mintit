import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
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
    @InjectConnection() private readonly mongo: Connection,
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
  ): Promise<ReadyResponseDto> {
    const checks: Record<string, HealthCheckDto> = {};

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    checks.database = { ok: this.mongo.readyState === 1 };

    const chainChecks = await this.chains.get(chain).healthCheck();
    Object.assign(checks, chainChecks);

    const ok = Object.values(checks).every((c) => c.ok);
    return { status: ok ? 'ok' : 'degraded', checks };
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
}
