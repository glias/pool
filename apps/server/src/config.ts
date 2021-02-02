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
  process.env.LIQUIDITY_ORDER_LOCK_CODE_HASH || '0x062f28d5303cf27273f89f88b03a4a591e70b1bf4983dd9c63dab9fad58aa9bb';
export const LIQUIDITY_ORDER_LOCK_HASH_TYPE = process.env.LIQUIDITY_ORDER_LOCK_HASH_TYPE || 'data';
export const SWAP_ORDER_LOCK_CODE_HASH =
  process.env.SWAP_ORDER_LOCK_CODE_HASH || '0xca8335dc0a37a5b4e86a475f1a91f5f3a57f3dccc8c9162f406337b83e8de3ac';
export const SWAP_ORDER_LOCK_HASH_TYPE = process.env.SWAP_ORDER_LOCK_HASH_TYPE || 'data';

// INFO CELL
export const INFO_LOCK_CODE_HASH =
  process.env.INFO_LOCK_CODE_HASH || '0x74f5bee3f3ebc5ff31dbeb4da1b37099dfde61fe5f251375fe3ca9618542cca2';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.INFO_LOCK_HASH_TYPE || 'data';

export const INFO_TYPE_CODE_HASH =
  process.env.INFO_TYPE_CODE_HASH || '0xec661b6f52897f9afb4d23c05151d6466d765a1ac5e3362f0471cc0c3c23f462';
export const INFO_TYPE_HASH_TYPE = process.env.INFO_TYPE_HASH_TYPE || 'data';

export const SUDT_TYPE_CODE_HASH =
  process.env.SUDT_TYPE_CODE_HASH || '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4';
export const SUDT_TYPE_HASH_TYPE = process.env.SUDT_TYPE_HASH_TYPE || 'type';

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
      '0xfba47c3228253066ab4d555b2eac140cffa8314e4a5bab81a7373de4097f4f3d',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_ORDER_LOCK_DEP = {
  outPoint: {
    txHash:
      process.env.SWAP_ORDER_LOCK_DEP_TX_HASH || '0xb5e597bd48ae8a631b2c46ad8b400fc74ed270ac208842533781b70eeec87f80',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH || '0x018bb612440c57a2cdb02dcbcd351782a5dacfb0234b1a16e46077acecedc150',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH || '0x1b5b869616946c78d4bdf5ee1cbd3ed755e1a8e1aff2b2216398c250fdc7eeeb',
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
