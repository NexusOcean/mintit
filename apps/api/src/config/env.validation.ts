import { Chain } from '@mintit/types';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsHexadecimal,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum MoneroNetwork {
  Stagenet = 'stagenet',
  Mainnet = 'mainnet',
}

export enum RateProvider {
  Cmc = 'cmc',
}

const toInt = ({ value }: { value: unknown }): number =>
  typeof value === 'number' ? value : parseInt(String(value), 10);

const toBool = ({ value }: { value: unknown }): boolean => {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const toChainArray = ({ value }: { value: unknown }): Chain[] => {
  const raw = Array.isArray(value) ? value : String(value).split(',');
  return raw.map((v) => v.trim().toLowerCase()) as Chain[];
};

export class EnvironmentVariables {
  // --- App ---
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  PORT: number = 3000;

  // --- Mongo ---
  @IsString()
  MONGO_URI!: string;

  @IsString()
  @IsOptional()
  MONGO_DB_NAME: string = 'mint_payments';

  // --- Monero network ---
  @IsEnum(MoneroNetwork)
  @IsOptional()
  MONERO_NETWORK: MoneroNetwork = MoneroNetwork.Stagenet;

  // --- monerod ---
  @IsUrl({ require_tld: false, require_protocol: true })
  @IsOptional()
  MONERO_DAEMON_URI?: string;

  @IsString()
  @IsOptional()
  MONERO_DAEMON_USER?: string;

  @IsString()
  @IsOptional()
  MONERO_DAEMON_PASSWORD?: string;

  // --- Wallet (view-only, in-process MoneroWalletFull) ---
  @IsString()
  @IsOptional()
  MONERO_WALLET_PATH?: string;

  @IsHexadecimal()
  @Length(64, 64)
  @IsOptional()
  MONERO_VIEW_KEY?: string;

  @IsString()
  @IsOptional()
  MONERO_PRIMARY_ADDRESS?: string;

  @Transform(toInt)
  @IsInt()
  @Min(0)
  @IsOptional()
  MONERO_RESTORE_HEIGHT?: number;

  // --- Firo RPC ---
  @IsString()
  @IsOptional()
  FIRO_RPC_HOST?: string;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  FIRO_RPC_PORT?: number;

  @IsString()
  @IsOptional()
  FIRO_RPC_USER?: string;

  @IsString()
  @IsOptional()
  FIRO_RPC_PASS?: string;

  @IsString()
  @IsOptional()
  FIRO_RPC_PROTOCOL: string = 'http';

  // --- PIVX RPC ---
  @IsString()
  @IsOptional()
  PIVX_RPC_HOST?: string;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  PIVX_RPC_PORT?: number;

  @IsString()
  @IsOptional()
  PIVX_RPC_USER?: string;

  @IsString()
  @IsOptional()
  PIVX_RPC_PASS?: string;

  @IsString()
  @IsOptional()
  PIVX_RPC_PROTOCOL: string = 'http';

  // --- Additional Pricing ---

  @IsString()
  @IsOptional()
  CMC_API_KEY?: string;

  // --- API auth ---
  @IsString()
  @MinLength(16)
  API_KEY!: string;

  @IsString()
  @MinLength(16)
  ADMIN_API_KEY!: string;

  @IsString()
  @IsOptional()
  DEMO_ADMIN_TOTP?: string;

  // --- Webhooks ---
  @IsString()
  WEBHOOK_SIGNING_SECRET!: string;

  // --- Tunable defaults (seed values; live values stored in Mongo Settings doc) ---
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @IsOptional()
  CONFIRMATION_DEPTH: number = 1;

  @Transform(toInt)
  @IsInt()
  @Min(60)
  @IsOptional()
  INVOICE_DEFAULT_EXPIRY_SEC: number = 20 * 60;

  @Transform(toInt)
  @IsInt()
  @Min(60)
  @IsOptional()
  INVOICE_MAX_EXPIRY_SEC: number = 30 * 60;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  SCANNER_INTERVAL_MS: number = 10_000;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  SCANNER_LOCK_TTL_MS: number = 30_000;

  @Transform(toInt)
  @IsInt()
  @Min(1)
  @IsOptional()
  MONERO_SYNCED_THRESHOLD_BLOCKS: number = 2;

  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  MONERO_PREWARM_SYNC: boolean = true;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  RATE_CACHE_TTL_MS: number = 45_000;

  @Transform(toInt)
  @IsInt()
  @Min(1)
  @IsOptional()
  WEBHOOK_MAX_ATTEMPTS: number = 8;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  WEBHOOK_DISPATCH_INTERVAL_MS: number = 5_000;

  @Transform(toInt)
  @IsInt()
  @IsOptional()
  WEBHOOK_TIMEOUT_MS: number = 10_000;

  // --- Enabled chains ---
  @Transform(toChainArray)
  @IsEnum(Chain, { each: true })
  ENABLED_CHAINS!: Chain[];
}

export const validateEnv = (
  config: Record<string, unknown>,
): EnvironmentVariables => {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.toString()}`);
  }

  if (!validated.ENABLED_CHAINS?.length) {
    throw new Error('ENABLED_CHAINS must specify at least one chain');
  }

  if (validated.ENABLED_CHAINS.includes(Chain.Xmr)) {
    const missing = [
      'MONERO_DAEMON_URI',
      'MONERO_DAEMON_USER',
      'MONERO_DAEMON_PASSWORD',
      'MONERO_WALLET_PATH',
    ].filter((k) => !validated[k as keyof EnvironmentVariables]);
    if (missing.length) {
      throw new Error(
        `XMR enabled but missing required vars: ${missing.join(', ')}`,
      );
    }
  }

  if (validated.ENABLED_CHAINS.includes(Chain.Firo)) {
    const missing = [
      'FIRO_RPC_HOST',
      'FIRO_RPC_PORT',
      'FIRO_RPC_USER',
      'FIRO_RPC_PASS',
    ].filter((k) => !validated[k as keyof EnvironmentVariables]);
    if (missing.length) {
      throw new Error(
        `Firo enabled but missing required vars: ${missing.join(', ')}`,
      );
    }
  }

  if (validated.ENABLED_CHAINS.includes(Chain.Pivx)) {
    const missing = [
      'PIVX_RPC_HOST',
      'PIVX_RPC_PORT',
      'PIVX_RPC_USER',
      'PIVX_RPC_PASS',
    ].filter((k) => !validated[k as keyof EnvironmentVariables]);
    if (missing.length) {
      throw new Error(
        `PIVX enabled but missing required vars: ${missing.join(', ')}`,
      );
    }
  }

  return validated;
};
