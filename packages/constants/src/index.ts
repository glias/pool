export * as testNet from './testnet';

export const CKB_DECIMAL = 100000000n;
export const MIN_TX_FEE = 61n * CKB_DECIMAL;
export const MIN_SUDT_DATA_SIZE = 16n;
export const MIN_SUDT_CAPACITY = 142n * CKB_DECIMAL;
export const SWAP_ORDER_CAPACITY = 188n * CKB_DECIMAL;
export const LIQUIDITY_ORDER_CAPACITY = 207n * CKB_DECIMAL;
export const INFO_CAPACITY = 214n * CKB_DECIMAL;
export const MIN_POOL_CAPACITY = 162n * CKB_DECIMAL;
export enum ORDER_TYPE {
  SellCKB = '0x00',
  BuyCKB = '0x01',
}

export const REQUEST_VERSION = 0;
export const CKB_TYPE_HASH = '0x000';
