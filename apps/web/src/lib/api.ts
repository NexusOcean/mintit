import axios from 'axios';
import Cookies from 'js-cookie';
import type { Chain } from '@mintit/types';

const TOKEN_COOKIE = 'admin_session';

const baseURL = import.meta.env.VITE_API_URL ?? '/v1';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_COOKIE);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403) &&
      window.location.pathname !== '/login'
    ) {
      clearToken();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export function setToken(token: string) {
  Cookies.set(TOKEN_COOKIE, token, { sameSite: 'strict', expires: 1 });
}

export function clearToken() {
  Cookies.remove(TOKEN_COOKIE);
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE);
}

export function resolveChain(param: string | null | undefined): Chain {
  if (param === 'firo') return 'firo' as Chain;
  return 'xmr' as Chain;
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
