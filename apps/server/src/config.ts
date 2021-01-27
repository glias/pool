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

export const PW_LOCK_CODE_HASH = process.env.PW_LOCK_CODE_HASH;
export const PW_LOCK_HASH_TYPE = process.env.PW_LOCK_HASH_TYPE;
export const SECP256K1_LOCK_CODE_HASH = process.env.SECP256K1_LOCK_CODE_HASH;
export const SECP256K1_LOCK_HASH_TYPE = process.env.SECP256K1_LOCK_HASH_TYPE;
export const LIQUIDITY_ORDER_LOCK_CODE_HASH = process.env.LIQUIDITY_ORDER_LOCK_CODE_HASH;
export const LIQUIDITY_ORDER_LOCK_HASH_TYPE = process.env.LIQUIDITY_ORDER_LOCK_HASH_TYPE;
export const SWAP_ORDER_LOCK_CODE_HASH = process.env.SWAP_ORDER_LOCK_CODE_HASH;
export const SWAP_ORDER_LOCK_HASH_TYPE = process.env.SWAP_ORDER_LOCK_HASH_TYPE;

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

export const CKB_TOKEN_TYPE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

// TODO: refactor to PoolHolder, <Symbol, TypeArgs>
export const POOL_INFO_TYPE_ARGS: Record<string, string> = {
  GLIA: '0x0000000000000000000000000000000000000000000000000000000000000016',
  ckETH: '0x0000000000000000000000000000000000000000000000000000000000000012',
  ckDAI: '0x0000000000000000000000000000000000000000000000000000000000000013',
  ckUSDC: '0x0000000000000000000000000000000000000000000000000000000000000014',
  ckUSDT: '0x0000000000000000000000000000000000000000000000000000000000000015',
};

export const POOL_INFO_TYPE_SCRIPT: dex.Script[] = [
  new dex.Script(INFO_TYPE_CODE_HASH, 'data', process.env.GLIA_ID || POOL_INFO_TYPE_ARGS['GLIA']),
  new dex.Script(INFO_TYPE_CODE_HASH, 'data', process.env.CKETH_ID || POOL_INFO_TYPE_ARGS['ckETH']),
  new dex.Script(INFO_TYPE_CODE_HASH, 'data', process.env.CKDAI_ID || POOL_INFO_TYPE_ARGS['ckDAI']),
  new dex.Script(INFO_TYPE_CODE_HASH, 'data', process.env.CKUSDC_ID || POOL_INFO_TYPE_ARGS['ckUSDC']),
  new dex.Script(INFO_TYPE_CODE_HASH, 'data', process.env.CKUSDT_ID || POOL_INFO_TYPE_ARGS['ckUSDT']),
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
    txHash: process.env.PW_LOCK_DEP_TX_HASH,
    index: '0x0',
  },
  depType: 'code',
};

export const LIQUIDITY_ORDER_LOCK_DEP = {
  outPoint: {
    txHash: process.env.LIQUIDITY_ORDER_LOCK_DEP_TX_HASH,
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_ORDER_LOCK_DEP = {
  outPoint: {
    txHash: process.env.SWAP_ORDER_LOCK_DEP_TX_HASH,
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH,
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH,
    index: '0x0',
  },
  depType: 'code',
};

export const SUDT_TYPE_DEP = {
  outPoint: {
    txHash: process.env.SUDT_TYPE_DEP_TX_HASH,
    index: '0x0',
  },
  depType: 'code',
};

export const SECP256K1_LOCK_DEP = {
  outPoint: {
    txHash: process.env.SECP256K1_LOCK_DEP_TX_HASH,
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
