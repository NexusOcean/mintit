import { createFiroRpcClient } from '@nexusocean/firo-rpc';

export const FIRO_CLIENT = Symbol('FIRO_CLIENT');
export type FiroClient = ReturnType<typeof createFiroRpcClient>;
