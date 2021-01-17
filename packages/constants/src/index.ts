export * as testNet from './testnet';

export const MIN_SUDT_CAPACITY = 142;
export const SWAP_ORDER_CAPACITY = 188;
export const LIQUIDITY_ORDER_CAPACITY = 207;
export const ORDER_VERSION = '0x01';

export const enum ORDER_TYPE {
  SellCKB = '0x00',
  BuyCKB = '0x01',
}

export const CKB_TYPE_HASH = '0x00';
export const LIQUIDITY_ORDER_LOCK_CODE_HASH = '0x00';
export const SWAP_ORDER_LOCK_CODE_HASH = '0x00';
