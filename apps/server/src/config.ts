import { HashType } from '@ckb-lumos/base';
import * as constants from '@gliaswap/constants';
import dotenv from 'dotenv';
dotenv.config();
import { MySqlConnectionConfig } from 'knex';

export const ckbConfig = {
  nodeUrl: process.env.CKB_NODE_RPC_URL || 'http://localhost:8114',
};

export const mysqlInfo: MySqlConnectionConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DATABASE || 'ckb',
};

export const env = process.env.NODE_ENV || 'development';

// INFO CELL
export const INFO_TYPE_CODE_HASH =
  process.env.INFO_TYPE_CODE_HASH || '0x2e44a62e4e447a2ae5acd0ca186a95f25f86d13571f6a177c5658ab0e63591e9';
export const INFO_TYPE_HASH_TYPE = process.env.INFO_TYPE_HASH_TYPE || 'type';

export const INFO_LOCK_CODE_HASH =
  process.env.INFO_LOCK_CODE_HASH || '0x8d35ff0c7402fd3ae7b1b90a854fb4d87c12d3956b7e40c9e973496753d7c1c6';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.INFO_LOCK_HASH_TYPE || 'type';

export const PW_LOCK_CODE_HASH =
  process.env.PW_LOCK_CODE_HASH || '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63';
export const PW_LOCK_HASH_TYPE = process.env.PW_LOCK_HASH_TYPE || 'type';
export const SECP256K1_LOCK_CODE_HASH =
  process.env.SECP256K1_LOCK_CODE_HASH || '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8';
export const SECP256K1_LOCK_HASH_TYPE = process.env.SECP256K1_LOCK_HASH_TYPE || 'type';
export const LIQUIDITY_LOCK_CODE_HASH =
  process.env.LIQUIDITY_LOCK_CODE_HASH || '0x74bfec21398da1990285d70df943b01e84399be1b6cf19e916f72f4e44bdb225';
export const LIQUIDITY_LOCK_HASH_TYPE = process.env.LIQUIDITY_LOCK_HASH_TYPE || 'type';
export const SWAP_LOCK_CODE_HASH =
  process.env.SWAP_LOCK_CODE_HASH || '0x9a81903addf2e696bf24ccbf7a28fec191249ae8f678c65fe813c1cea8a331b9';
export const SWAP_LOCK_HASH_TYPE = process.env.SWAP_LOCK_HASH_TYPE || 'type';

export const SUDT_TYPE_CODE_HASH =
  process.env.SUDT_TYPE_CODE_HASH || '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4';
export const SUDT_TYPE_HASH_TYPE = process.env.SUDT_TYPE_HASH_TYPE || 'type';

export const CKB_STR_TO_HASH =
  process.env.CKB_STR_TO_HASH ||
  '0x636b6200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export const CKB_TOKEN_TYPE_HASH = constants.CKB_TYPE_HASH;

export const PW_LOCK_DEP = {
  outPoint: {
    txHash: process.env.PW_LOCK_DEP_TX_HASH || '0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38',
    index: '0x0',
  },
  depType: 'code',
};

export const LIQUIDITY_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.LIQUIDITY_LOCK_DEP_TX_HASH || '0x74b0d1a9dcae10b3d9f6dd86bdd06abde1df9a0a6a4866afab20bcb3413a56a0',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_LOCK_DEP = {
  outPoint: {
    txHash: process.env.SWAP_LOCK_DEP_TX_HASH || '0xc48d1abd6b37b4fcf9525d361e0c528b4c9bcae82e1f6b1bc2743a401aef7206',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH || '0x86b757df2d9f20c950b6bfeec48349ce7b4c48c9c89575f1ff68cc13cf487fc8',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH || '0x611833ecfb298026d554ce3a8183d8c31867172b12d1ef81d45d6c1d91f0d5fc',
    index: '0x0',
  },
  depType: 'code',
};

export const SUDT_TYPE_DEP = {
  outPoint: {
    txHash: process.env.SUDT_TYPE_DEP_TX_HASH || '0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769',
    index: '0x0',
  },
  depType: 'code',
};

export const SECP256K1_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.SECP256K1_LOCK_DEP_TX_HASH || '0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37',
    index: '0x0',
  },
  depType: 'dep_group',
};

export const LOCK_DEPS = {};
LOCK_DEPS[PW_LOCK_CODE_HASH] = [PW_LOCK_DEP, SECP256K1_LOCK_DEP];
LOCK_DEPS[SECP256K1_LOCK_CODE_HASH] = [SECP256K1_LOCK_DEP];

export const forceBridgeServerUrl = process.env.FORCE_BRIDGE_SERVER_ADDRESS || 'http://121.196.29.165:3003';

export const TX_VERSION = '0x0';
export const FEE_RATE = 1300;

export const PW_WITNESS_ARGS = {
  Secp256k1: {
    lock: '0x' + '0'.repeat(130),
    inputType: '',
    outputType: '',
  },
  Secp256r1: {
    lock: '0x' + '0'.repeat(600),
    inputType: '',
    outputType: '',
  },
};
export const PW_ECDSA_WITNESS_LEN = 172;
export const SECP256K1_WITNESS_ARGS = {
  lock: '',
  inputType: '',
  outputType: '',
};
