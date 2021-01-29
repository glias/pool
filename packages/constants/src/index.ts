export * as testNet from './testnet';

export const CKB_DECIMAL = 100000000n;
export const MIN_TX_FEE = 61n * CKB_DECIMAL;
export const MIN_SUDT_DATA_SIZE = 16n;
export const MIN_SUDT_CAPACITY = 154n * CKB_DECIMAL;
export const SWAP_SELL_REQ_CAPACITY = 227n * CKB_DECIMAL;
export const SWAP_BUY_REQ_CAPACITY = 146n * CKB_DECIMAL;
export const LIQUIDITY_ORDER_CAPACITY = 235n * CKB_DECIMAL;
export const INFO_CAPACITY = 250n * CKB_DECIMAL;
export const MIN_POOL_CAPACITY = 186n * CKB_DECIMAL;

export const REQUEST_VERSION = 1;
export const CKB_TYPE_HASH = `0x${'0'.repeat(64)}`;
