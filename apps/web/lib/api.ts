import axios from 'axios';
import type { Chain } from '@mintit/types';

// Browser-side: hits Next.js API routes (which proxy to NestJS)
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Server-side: Mint service
export const mintApi = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:8080/v1',
  headers: {
    'X-Admin-Api-Key': process.env.ADMIN_API_KEY ?? '',
    'X-Api-Key': process.env.API_KEY ?? '',
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getChainApi(_chain: Chain) {
  return mintApi;
}

export function resolveChain(param: string | null | undefined): Chain {
  if (param === 'firo') return 'firo' as Chain;
  return 'xmr' as Chain;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAuthApi(_chain?: Chain) {
  return mintApi;
}

// Re-export enums and shared types
export { Chain, Asset, InvoiceStatus } from '@mintit/types';
export type {
  InvoiceDto,
  InvoiceListDto,
  WalletInfoDto,
  HealthCheckDto,
  HealthReadyDto,
  HealthSyncedDto,
  SettingsDto,
} from '@mintit/types';

// Legacy aliases — keep old names working across the web app
export type { InvoiceDto as Invoice } from '@mintit/types';
export type { InvoiceListDto as InvoiceListResponse } from '@mintit/types';
export type { SettingsDto as Settings } from '@mintit/types';
export type { HealthReadyDto as HealthReady } from '@mintit/types';
export type { HealthSyncedDto as HealthSynced } from '@mintit/types';
export type { WalletInfoDto as WalletInfo } from '@mintit/types';

// Discriminated wallet shapes used by wallet page
export interface XmrWalletInfo {
  chain: 'xmr';
  primaryAddress: string;
  viewKey: string;
  restoreHeight: number;
  walletHeight: number;
  daemonHeight: number;
  synced: boolean;
}

export interface FiroWalletInfo {
  chain: 'firo';
  blockHeight: number;
  availableBalance: number;
  unconfirmedBalance: number;
  hdMasterKeyId?: string;
  keypoolSize: number;
}
