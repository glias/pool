import * as constants from '@gliaswap/constants';
import { HashType } from '@ckb-lumos/base';
import dotenv from 'dotenv';
dotenv.config();
import { MySqlConnectionConfig } from 'knex';
import * as dex from './model';

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

export const PW_LOCK_CODE_HASH =
  process.env.PW_LOCK_CODE_HASH || '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63';
export const PW_LOCK_HASH_TYPE = process.env.PW_LOCK_HASH_TYPE || 'type';
export const SECP256K1_LOCK_CODE_HASH =
  process.env.SECP256K1_LOCK_CODE_HASH || '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8';
export const SECP256K1_LOCK_HASH_TYPE = process.env.SECP256K1_LOCK_HASH_TYPE || 'type';
export const LIQUIDITY_ORDER_LOCK_CODE_HASH =
  process.env.LIQUIDITY_ORDER_LOCK_CODE_HASH || '0xe29e05537c84f459b706753df58ad8b43c346d7ff7d7926c58237ef9b0a7bbf3';
export const LIQUIDITY_ORDER_LOCK_HASH_TYPE = process.env.LIQUIDITY_ORDER_LOCK_HASH_TYPE || 'data';
export const SWAP_ORDER_LOCK_CODE_HASH =
  process.env.SWAP_ORDER_LOCK_CODE_HASH || '0xc632e1aa84105366a4adfb14361164241b1dc68b000218db1e61806bbfc0be57';
export const SWAP_ORDER_LOCK_HASH_TYPE = process.env.SWAP_ORDER_LOCK_HASH_TYPE || 'data';

// INFO CELL
export const INFO_LOCK_CODE_HASH =
  process.env.INFO_LOCK_CODE_HASH || '0x10490e5d8c7a5330db3c5067efc79464b2920b1a01db2199737d51a597633e15';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.INFO_LOCK_HASH_TYPE || 'data';

export const INFO_TYPE_CODE_HASH =
  process.env.INFO_TYPE_CODE_HASH || '0xb7a3d73a77f315a86381247cd763fa3269b1627cbf696aa24f17b9010cccb04c';
export const INFO_TYPE_HASH_TYPE = process.env.INFO_TYPE_HASH_TYPE || 'data';

export const SUDT_TYPE_CODE_HASH =
  process.env.SUDT_TYPE_CODE_HASH || '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4';
export const CKB_STR_TO_HASH =
  process.env.CKB_STR_TO_HASH ||
  '0x636b6200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export const CKB_TOKEN_TYPE_HASH = constants.CKB_TYPE_HASH;

// TODO: refactor to PoolHolder, <Symbol, TypeArgs>
export const POOL_INFO_TYPE_ARGS: Record<string, string> = {
  GLIA: '0x0000000000000000000000000000000000000000000000000000000000000016',
  ckETH: '0x0000000000000000000000000000000000000000000000000000000000000012',
  ckDAI: '0x0000000000000000000000000000000000000000000000000000000000000013',
  ckUSDC: '0x0000000000000000000000000000000000000000000000000000000000000014',
  ckUSDT: '0x0000000000000000000000000000000000000000000000000000000000000015',
};

export const POOL_INFO_TYPE_SCRIPT: dex.Script[] = [
  new dex.Script(INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE, POOL_INFO_TYPE_ARGS['GLIA']),
  new dex.Script(INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE, POOL_INFO_TYPE_ARGS['ckETH']),
  new dex.Script(INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE, POOL_INFO_TYPE_ARGS['ckDAI']),
  new dex.Script(INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE, POOL_INFO_TYPE_ARGS['ckUSDC']),
  new dex.Script(INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE, POOL_INFO_TYPE_ARGS['ckUSDT']),
];

export const POOL_ID: Record<string, string> = {
  GLIA: POOL_INFO_TYPE_SCRIPT[0].toHash(),
  ckETH: POOL_INFO_TYPE_SCRIPT[1].toHash(),
  ckDAI: POOL_INFO_TYPE_SCRIPT[2].toHash(),
  ckUSDC: POOL_INFO_TYPE_SCRIPT[3].toHash(),
  ckUSDT: POOL_INFO_TYPE_SCRIPT[4].toHash(),
};

export const PW_LOCK_DEP = {
  outPoint: {
    txHash: process.env.PW_LOCK_DEP_TX_HASH || '0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38',
    index: '0x0',
  },
  depType: 'code',
};

export const LIQUIDITY_ORDER_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.LIQUIDITY_ORDER_LOCK_DEP_TX_HASH ||
      '0x1e4b3b77f46a767d65e2af14f5d27c90fca61e1207d416e42493bfb2183229c8',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_ORDER_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.SWAP_ORDER_LOCK_DEP_TX_HASH || '0xbc5f82c939129202f32c10fbdc71ab8ed224b8c1fa0a8ebb4f69111b6a6933de',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH || '0xdaaf991904fa940095a515ffc27c6100f8fccc136454a39d0d529b685008cf84',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH || '0x92a1327f94435d4b7bbb11a1f369effb5d02fa997ad9aa5cfc60b788c27ff012',
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
LOCK_DEPS[PW_LOCK_CODE_HASH] = PW_LOCK_DEP;
LOCK_DEPS[SECP256K1_LOCK_CODE_HASH] = SECP256K1_LOCK_DEP;

export const forceBridgeServerUrl = process.env.FORCE_BRIDGE_SERVER_ADDRESS || 'http://121.196.29.165:3003';

export const TX_VERSION = '0x0';
export const FEE_RATE = 1000;

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
