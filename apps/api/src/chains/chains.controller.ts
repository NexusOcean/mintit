import { Controller, Get } from '@nestjs/common';
import { ChainsService } from './chains.service';
import type { ConfigResponseDto } from '@mintit/types';

@Controller('chains')
export class ChainsController {
  constructor(private readonly chains: ChainsService) {}

  @Get()
  getConfig(): ConfigResponseDto {
    return { enabledChains: this.chains.enabledChains() };
  }
}
