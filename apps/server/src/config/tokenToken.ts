import { HashType } from '@ckb-lumos/base';

// INFO CELL
export const INFO_TYPE_CODE_HASH =
  process.env.TOKEN_TOKEN_INFO_TYPE_CODE_HASH || '0x2e44a62e4e447a2ae5acd0ca186a95f25f86d13571f6a177c5658ab0e63591e9';
export const INFO_TYPE_HASH_TYPE = process.env.TOKEN_TOKEN_INFO_TYPE_HASH_TYPE || 'type';

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_INFO_TYPE_DEP_TX_HASH ||
      '0x86b757df2d9f20c950b6bfeec48349ce7b4c48c9c89575f1ff68cc13cf487fc8',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_INFO_LOCK_CODE_HASH || '0x74f5bee3f3ebc5ff31dbeb4da1b37099dfde61fe5f251375fe3ca9618542cca2';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.TOKEN_TOKEN_INFO_LOCK_HASH_TYPE || 'data';

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_INFO_LOCK_DEP_TX_HASH ||
      '0x611833ecfb298026d554ce3a8183d8c31867172b12d1ef81d45d6c1d91f0d5fc',
    index: '0x0',
  },
  depType: 'code',
};

export const LIQUIDITY_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_CODE_HASH ||
  '0x74bfec21398da1990285d70df943b01e84399be1b6cf19e916f72f4e44bdb225';
export const LIQUIDITY_LOCK_HASH_TYPE = process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_HASH_TYPE || 'type';

export const LIQUIDITY_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_LIQUIDITY_LOCK_DEP_TX_HASH ||
      '0x74b0d1a9dcae10b3d9f6dd86bdd06abde1df9a0a6a4866afab20bcb3413a56a0',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_LOCK_CODE_HASH =
  process.env.TOKEN_TOKEN_SWAP_LOCK_CODE_HASH || '0x9a81903addf2e696bf24ccbf7a28fec191249ae8f678c65fe813c1cea8a331b9';
export const SWAP_LOCK_HASH_TYPE = process.env.TOKEN_TOKEN_SWAP_LOCK_HASH_TYPE || 'type';

export const SWAP_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.TOKEN_TOKEN_SWAP_LOCK_DEP_TX_HASH ||
      '0xc48d1abd6b37b4fcf9525d361e0c528b4c9bcae82e1f6b1bc2743a401aef7206',
    index: '0x0',
  },
  depType: 'code',
};
