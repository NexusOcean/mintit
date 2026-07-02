import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { EnvironmentVariables } from '../config/env.validation';
import { safeEqual } from './safe-equal';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const provided = req.header('x-api-key');
    const expected = this.config.get('API_KEY', { infer: true });
    if (!provided || !safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
