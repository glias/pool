export * as testNet from './testnet';

export const MIN_SUDT_CAPACITY = 142;
export const SWAP_ORDER_CAPACITY = 188;
export const LIQUIDITY_ORDER_CAPACITY = 207;
export const INFO_CAPACITY = 214;
export const MIN_POOL_CAPACITY = 162;
export enum ORDER_TYPE {
  SellCKB = '0x0',
  BuyCKB = '0x1',
}

export const ORDER_VERSION = '0x1';
export const CKB_TYPE_HASH = '0x000';
