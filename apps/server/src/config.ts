import * as dex from './model';
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

export const LIQUIDITY_ORDER_LOCK_CODE_HASH = process.env.LIQUIDITY_ORDER_LOCK_CODE_HASH;
export const SWAP_ORDER_LOCK_CODE_HASH = process.env.SWAP_ORDER_LOCK_CODE_HASH;
export const SWAP_ORDER_LOCK_HASH_TYPE = process.env.SWAP_ORDER_LOCK_HASH_TYPE;
export const INFO_TYPE_CODE_HASH =
  process.env.INFO_TYPE_CODE_HASH || '0x0000000000000000000000000000000000000000000000000000000000000011';
export const INFO_LOCK_CODE_HASH =
  process.env.INFO_LOCK_CODE_HASH || '0x0000000000000000000000000000000000000000000000000000000000000004';
export const SUDT_TYPE_CODE_HASH =
  process.env.SUDT_TYPE_CODE_HASH || '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4';

export const CKB_STR_TO_HASH =
  process.env.CKB_STR_TO_HASH ||
  '0x636b6200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export const CKB_TOKEN_TYPE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

// TODO: refactor to PoolHolder, <Symbol, TypeArgs>
export const POOL_INFO_ID: Record<string, string> = {
  GLIA: '0x0000000000000000000000000000000000000000000000000000000000000011',
  ckETH: '0x0000000000000000000000000000000000000000000000000000000000000012',
  ckDAI: '0x0000000000000000000000000000000000000000000000000000000000000013',
  ckUSDC: '0x0000000000000000000000000000000000000000000000000000000000000014',
  ckUSDT: '0x0000000000000000000000000000000000000000000000000000000000000015',
};

export const POOL_INFO_TYPE_SCRIPT: dex.Script[] = [
  new dex.Script(
    INFO_TYPE_CODE_HASH,
    'type',
    process.env.GLIA_ID || '0x0000000000000000000000000000000000000000000000000000000000000011',
  ),
  new dex.Script(
    INFO_TYPE_CODE_HASH,
    'type',
    process.env.CKETH_ID || '0x0000000000000000000000000000000000000000000000000000000000000012',
  ),
  new dex.Script(
    INFO_TYPE_CODE_HASH,
    'type',
    process.env.CKDAI_ID || '0x0000000000000000000000000000000000000000000000000000000000000013',
  ),
  new dex.Script(
    INFO_TYPE_CODE_HASH,
    'type',
    process.env.CKUSDC_ID || '0x0000000000000000000000000000000000000000000000000000000000000014',
  ),
  new dex.Script(
    INFO_TYPE_CODE_HASH,
    'type',
    process.env.CKUSDT_ID || '0x0000000000000000000000000000000000000000000000000000000000000015',
  ),
];

export const LIQUIDITY_ORDER_LOCK_DEP = {
  outPoint: {
    txHash: process.env.LIQUIDITY_ORDER_LOCK_DEP_TX_HASH,
    index: '0x00',
  },
  depType: 'code',
};

export const SWAP_ORDER_LOCK_DEP = {
  outPoint: {
    txHash: process.env.SWAP_ORDER_LOCK_DEP_TX_HASH,
    index: '0x00',
  },
  depType: 'code',
};

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH,
    index: '0x00',
  },
  depType: 'code',
};

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH,
    index: '0x00',
  },
  depType: 'code',
};

export const SUDT_TYPE_DEP = {
  outPoint: {
    txHash: process.env.SUDT_TYPE_DEP_TX_HASH || '0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958',
    index: '0x00',
  },
  depType: 'code',
};

export const forceBridgeServerUrl = process.env.FORCE_BRIDGE_SERVER_ADDRESS || 'http://121.196.29.165:3003';

export const TX_VERSION = '0x0';

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
export const FEE_RATE = 1000;
