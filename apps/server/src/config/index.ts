import { HashType } from '@ckb-lumos/base';
import * as constants from '@gliaswap/constants';
import dotenv from 'dotenv';
import { MySqlConnectionConfig } from 'knex';
import * as tokenTokenConfig from './tokenToken';

dotenv.config();

export { tokenTokenConfig };

export const ckbConfig = {
  nodeUrl: process.env.CKB_NODE_RPC_URL || 'http://localhost:8114',
};

export const redisConfiguration = {
  address: process.env.REDIS_ADDRESS || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  auth: process.env.REDIS_AUTH || '123456',
  db: process.env.REDIS_DB_INDEX || 8,
};

export const mysqlInfo: MySqlConnectionConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DATABASE || 'ckb',
};

export const env = process.env.NODE_ENV || 'development';

interface ExplorerConfig {
  explorerTokensUrl: string;
  explorerCorsReferrer: string;
}

export const explorerConfig: ExplorerConfig = {
  explorerTokensUrl: process.env.EXPLORER_TOKENS_URL
    ? process.env.EXPLORER_TOKENS_URL
    : 'https://api.explorer.nervos.org/testnet/api/v1/udts',
  explorerCorsReferrer: process.env.EXPLORER_CORS_REFERRER
    ? process.env.EXPLORER_CORS_REFERRER
    : 'https://explorer.nervos.org/',
};

export const BLOCK_NUMBER = process.env.BLOCK_NUMBER
  ? `0x${Number(process.env.BLOCK_NUMBER).toString(16)}`
  : `0x${Number(1399517).toString(16)}`;

// INFO CELL
export const INFO_TYPE_CODE_HASH =
  process.env.INFO_TYPE_CODE_HASH || '0x2ee1f563be3859eca015b195fd66a750e19b9457b87891539fb819761a15b7c2';
export const INFO_TYPE_HASH_TYPE = <HashType>process.env.INFO_TYPE_HASH_TYPE || 'type';

export const INFO_LOCK_CODE_HASH =
  process.env.INFO_LOCK_CODE_HASH || '0x7c2b630c4471261e34d435d498285ba5b704556954ddcee4836f4af2abcd75dc';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.INFO_LOCK_HASH_TYPE || 'type';

export const LIQUIDITY_LOCK_CODE_HASH =
  process.env.LIQUIDITY_LOCK_CODE_HASH || '0x74bfec21398da1990285d70df943b01e84399be1b6cf19e916f72f4e44bdb225';
export const LIQUIDITY_LOCK_HASH_TYPE = process.env.LIQUIDITY_LOCK_HASH_TYPE || 'type';
export const SWAP_LOCK_CODE_HASH =
  process.env.SWAP_LOCK_CODE_HASH || '0xe989283a5301ec5d91829aec12035d3ffbd39f3109fb33afef1f9287f6a8a504';
export const SWAP_LOCK_HASH_TYPE = process.env.SWAP_LOCK_HASH_TYPE || 'type';

export const PW_LOCK_CODE_HASH =
  process.env.PW_LOCK_CODE_HASH || '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63';
export const PW_LOCK_HASH_TYPE = process.env.PW_LOCK_HASH_TYPE || 'type';
export const SECP256K1_LOCK_CODE_HASH =
  process.env.SECP256K1_LOCK_CODE_HASH || '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8';
export const SECP256K1_LOCK_HASH_TYPE = process.env.SECP256K1_LOCK_HASH_TYPE || 'type';

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
      process.env.LIQUIDITY_LOCK_DEP_TX_HASH || '0x5d7b911ef89082a5194f4413ca279832ff0d7e3073487614d348bc7fc3380d4f',
    index: '0x0',
  },
  depType: 'code',
};

export const SWAP_LOCK_DEP = {
  outPoint: {
    txHash: process.env.SWAP_LOCK_DEP_TX_HASH || '0xfbdea6573abd0b6288577f1715ac393fb90afd49ffbc94ee4e0f3afa24fc3edf',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH || '0942a05b6a71bf45be60362b4c96030385835ad7d6767c8ff57484d8229891b7',
    index: '0x0',
  },
  depType: 'code',
};

export const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH || '0x016968c4eb8b707cf7fbed26880159a9b19e7007e706718d7adbaffcb990569a',
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

export const FORCE_BRIDGE_SERVER_URL = process.env.FORCE_BRIDGE_SERVER_ADDRESS || 'http://47.56.233.149:3005';
export const FORCE_BRIDGE_LOCK_HASH_CODE =
  process.env.FORCE_BRIDGE_LOCK_HASH_CODE || '0xb42f76b833a4fe65abe2d412ff8280603f4c6b83e988816bdeac5526b53ff8a4';

export const FORCE_BRIDGE_SETTINGS = {
  eth_token_locker_addr: '0xf9f9cc809701529e5E396f2D68CDb3fe2E3E19EE',
  eth_ckb_chain_addr: '0xdC1A2f8D12Aa1bA9a6edd99A473cF50710B09FbD',
  bridge_lockscript: {
    code_hash: 'b42f76b833a4fe65abe2d412ff8280603f4c6b83e988816bdeac5526b53ff8a4',
    hash_type: 1,
    outpoint: {
      tx_hash: '4c5cb9807df7dd648f42e3185ef8526e32041c8eea94aaa00691209d92d639a1',
      index: 0,
      dep_type: 0,
    },
  },
  bridge_typescript: {
    code_hash: '83f5f181072704822f003367d574cf968cb9e83b85732762260961d92751f080',
    hash_type: 1,
    outpoint: {
      tx_hash: '4c5cb9807df7dd648f42e3185ef8526e32041c8eea94aaa00691209d92d639a1',
      index: 1,
      dep_type: 0,
    },
  },
  light_client_typescript: {
    code_hash: '7e74f0ea75d4530d1c6d9a16bd37879556d2c72dfcef9281d7d72384b8e05000',
    hash_type: 1,
    outpoint: {
      tx_hash: '4c5cb9807df7dd648f42e3185ef8526e32041c8eea94aaa00691209d92d639a1',
      index: 3,
      dep_type: 0,
    },
  },
  recipient_typescript: {
    code_hash: '6299a3ddb1b4ddfe8e5def025fe03bfbf15bf53e369efc16becd43b12d716775',
    hash_type: 1,
    outpoint: {
      tx_hash: '4c5cb9807df7dd648f42e3185ef8526e32041c8eea94aaa00691209d92d639a1',
      index: 2,
      dep_type: 0,
    },
  },
  simple_bridge_typescript: {
    code_hash: '08c3b82c5a596b04de4a7d8ee6528510f8ce7b98e8046005d7da00b3e5c2110e',
    hash_type: 1,
    outpoint: {
      tx_hash: '4c5cb9807df7dd648f42e3185ef8526e32041c8eea94aaa00691209d92d639a1',
      index: 4,
      dep_type: 0,
    },
  },
  sudt: {
    code_hash: 'c5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
    hash_type: 1,
    outpoint: {
      tx_hash: 'e12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769',
      index: 0,
      dep_type: 0,
    },
  },
  light_client_cell_script: {
    cell_script:
      '590000001000000030000000310000007e74f0ea75d4530d1c6d9a16bd37879556d2c72dfcef9281d7d72384b8e050000124000000b0579ff4509580f554cee7326a1ee17167b6bfb03f31357aaf4d0608bc9e06b500000000',
  },
  multisig_address: {
    addresses: ['ckt1qyqw2acss3ykp96lyaxrzemdqj0e24kwkqgsltvzrw'],
    require_first_n: 0,
    threshold: 1,
  },
  ckb_relay_mutlisig_threshold: {
    threshold: 1,
  },
  pw_locks: {
    inner: [
      {
        tx_hash: '57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38',
        index: 0,
        dep_type: 0,
      },
      {
        tx_hash: 'f8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37',
        index: 0,
        dep_type: 1,
      },
    ],
  },
};
