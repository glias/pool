import { HashType } from '@ckb-lumos/base';

// INFO TYPE CELL DEP
export const INFO_TYPE_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_INFO_TYPE_DEP_TX_HASH ||
      '0xc30a45d5ad230772a78345bed3601b0ab1355eb7d687f1e648a2ebdc354c460c',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_CODE_HASH =
  process.env.TOKEN_TOKEN_INFO_TYPE_CODE_HASH || '0x913e224b3aa45508e334cce929c817f85adf5183035aa79aaf377f673060eae6';
export const INFO_TYPE_HASH_TYPE = <HashType>process.env.TOKEN_TOKEN_INFO_TYPE_HASH_TYPE || 'type';

// INFO LOCK CELL DEL
export const INFO_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_INFO_LOCK_DEP_TX_HASH ||
      '0xb99ec912e702405c47ec0324f5e1e7aa205501357b3e1aba701730a7407bdade',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_INFO_LOCK_CODE_HASH || '0x18f5108405ce91f56d28e8aab757390e3f0b24cfc91f0c2becfebd1f60562fb3';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.TOKEN_TOKEN_INFO_LOCK_HASH_TYPE || 'type';

// LIQUIDITY LOCK CELL DEP
export const LIQUIDITY_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_DEP_TX_HASH ||
      '0x8233c14fc0fff21ecdbf05a920e57643900564fa4e527506c748f019cef04577',
    index: '0x0',
  },
  depType: 'code',
};

export const LIQUIDITY_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_CODE_HASH ||
  '0x278d68ecf162457455d1bf97dd42f01387057c1b00548bddbf455140b15f3bfa';
export const LIQUIDITY_LOCK_HASH_TYPE = process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_HASH_TYPE || 'type';

// SWAP LOCK CELL DEP
export const SWAP_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_SWAP_LOCK_DEP_TX_HASH ||
      '0x46697ec5a1eaa19d340deea3ab19ba59fc0b439d27ed22dc076c4089c2d5efdb',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_SWAP_LOCK_CODE_HASH || '0x3a0fd5c95136083b93d8c8e2f5b6509a9e25b76369e1ed66bba50dcc0032c822';
export const SWAP_LOCK_HASH_TYPE = process.env.TOKEN_TOKEN_SWAP_LOCK_HASH_TYPE || 'type';
