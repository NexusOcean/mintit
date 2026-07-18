export enum InvoiceStatus {
  Pending = 'pending',
  Seen = 'seen',
  Confirmed = 'confirmed',
  Underpaid = 'underpaid',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum Chain {
  Xmr = 'xmr',
  Firo = 'firo',
}

export enum Asset {
  Xmr = 'xmr',
  Firo = 'firo',
}

export enum UserScope {
  ADMIN = 'admin',
  MANAGER = 'manager',
}

export interface ConfigResponseDto {
  enabledChains: Chain[];
}

export interface InvoiceDto {
  id: string;
  publicId: string;
  chain: Chain;
  asset: Asset;
  assetDecimals: number;
  address: string;
  addressIndex: number;
  amountAtomic: string;
  amountFiat: number;
  fiatCurrency: string;
  rate: number;
  rateLockedAt: string;
  expiresAt: string;
  status: InvoiceStatus;
  confirmationsRequired: number;
  confirmations: number;
  receivedAtomic: string;
  createdAt: string;
  firstSeenAt?: string;
  paidAt?: string;
  webhookUrl?: string;
  chainData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface InvoiceListDto {
  data: InvoiceDto[];
  total: number;
  page: number;
  limit: number;
}

export interface WalletInfoDto {
  chain: Chain;
  // XMR fields
  primaryAddress?: string;
  viewKey?: string;
  restoreHeight?: number;
  walletHeight?: number;
  daemonHeight?: number;
  synced?: boolean;
  // Firo fields
  blockHeight?: number;
  availableBalance?: number;
  unconfirmedBalance?: number;
  hdMasterKeyId?: string;
  keypoolSize?: number;
}

export interface HealthCheckDto {
  ok: boolean;
  detail?: string;
}

export interface HealthReadyDto {
  status: 'ok' | 'degraded';
  checks: Record<string, HealthCheckDto>;
}

export interface HealthSyncedDto {
  status: 'ok' | 'syncing';
  walletHeight: number;
  daemonHeight: number;
  behind: number;
  detail?: string;
}

export interface GlobalSettingsDto {
  rateCacheTtlMs: number;
  webhookMaxAttempts: number;
  webhookTimeoutMs: number;
  webhookDispatchIntervalMs: number;
}

export interface SettingsDto extends GlobalSettingsDto {
  confirmationDepth: number;
  invoiceDefaultExpirySec: number;
  invoiceMaxExpirySec: number;
  scannerLockTtlMs: number;
  syncedThresholdBlocks: number;
}
