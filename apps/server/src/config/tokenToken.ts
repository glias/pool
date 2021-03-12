import { HashType } from '@ckb-lumos/base';

// INFO TYPE CELL DEP
export const INFO_TYPE_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_INFO_TYPE_DEP_TX_HASH ||
      '0x19719e02cfaf0333a978139d8ca766f36f2eac1aa4e7bd29d550594c786d354c',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_CODE_HASH =
  process.env.TOKEN_TOKEN_INFO_TYPE_CODE_HASH || '0x6ba71d7b19872c489fb627fad59d34478ae180f585bb6699ce2179da87cb8003';
export const INFO_TYPE_HASH_TYPE = <HashType>process.env.TOKEN_TOKEN_INFO_TYPE_HASH_TYPE || 'data';

// INFO LOCK CELL DEL
export const INFO_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_INFO_LOCK_DEP_TX_HASH ||
      '0x5c38faaa4a7e00a7735bbcc02b6b98a3a7bae5769a218929ebaf615cddbb7f23',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_INFO_LOCK_CODE_HASH || '0x20405d74b2fe6b7a9ced51e9a8bb7b10d2c78aaca4d996ba20c838395cde74ee';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.TOKEN_TOKEN_INFO_LOCK_HASH_TYPE || 'data';

// LIQUIDITY LOCK CELL DEP
export const LIQUIDITY_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_DEP_TX_HASH ||
      '0x543314996191cb2b525805535111df3c89b6d8202b731e1f69b8500323deeb78',
    index: '0x0',
  },
  depType: 'code',
};

export const LIQUIDITY_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_CODE_HASH ||
  '0x267389b032bf58c19dcf6162834d7201d89f401989a2f440b19bc3825c6a243d';
export const LIQUIDITY_LOCK_HASH_TYPE = process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_HASH_TYPE || 'data';

// SWAP LOCK CELL DEP
export const SWAP_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_SWAP_LOCK_DEP_TX_HASH ||
      '0xb62f95ad44d31fb94eba3708a355a4c1000f6a606a2055597b2050b7e2bda8c7',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_SWAP_LOCK_CODE_HASH || '0x14117f559088695f44087729b616b2afe13b3af1c43a0fc68bba338560e9120d';
export const SWAP_LOCK_HASH_TYPE = process.env.TOKEN_TOKEN_SWAP_LOCK_HASH_TYPE || 'data';
