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

// INFO CELL
export const INFO_TYPE_CODE_HASH =
  process.env.INFO_TYPE_CODE_HASH || '0x2e44a62e4e447a2ae5acd0ca186a95f25f86d13571f6a177c5658ab0e63591e9';
export const INFO_TYPE_HASH_TYPE = process.env.INFO_TYPE_HASH_TYPE || 'type';

export const INFO_LOCK_CODE_HASH =
  process.env.INFO_LOCK_CODE_HASH || '0x74f5bee3f3ebc5ff31dbeb4da1b37099dfde61fe5f251375fe3ca9618542cca2';
export const INFO_LOCK_HASH_TYPE: HashType = <HashType>process.env.INFO_LOCK_HASH_TYPE || 'data';

export const LIQUIDITY_LOCK_CODE_HASH =
  process.env.LIQUIDITY_LOCK_CODE_HASH || '0x74bfec21398da1990285d70df943b01e84399be1b6cf19e916f72f4e44bdb225';
export const LIQUIDITY_LOCK_HASH_TYPE = process.env.LIQUIDITY_LOCK_HASH_TYPE || 'type';
export const SWAP_LOCK_CODE_HASH =
  process.env.SWAP_LOCK_CODE_HASH || '0x9a81903addf2e696bf24ccbf7a28fec191249ae8f678c65fe813c1cea8a331b9';
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

export const FORCE_BRIDGE_SERVER_URL = process.env.FORCE_BRIDGE_SERVER_ADDRESS || 'http://121.196.29.165:3003';
export const FORCE_BRIDGE_LOCK_HASH_CODE =
  process.env.FORCE_BRIDGE_LOCK_HASH_CODE || '0x177a569f067154c4d4a65560c1a0697aff8922f1c74640f70d9cf073e4a6fec0';

export const FORCE_BRIDGE_SETTINGS = {
  eth_token_locker_addr: '0x4347818B33aaf0b442A977900585B9ad1e1B581F',
  eth_ckb_chain_addr: '0xEab024D7A450F8168855186E7D6c8eC40EB0e99c',
  bridge_lockscript: {
    code_hash: '177a569f067154c4d4a65560c1a0697aff8922f1c74640f70d9cf073e4a6fec0',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 0, dep_type: 0 },
  },
  bridge_typescript: {
    code_hash: 'eaf7bdcf8748a9dc57274e1eb94974b009e17a0f69cc2310b65582d7c93c3550',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 1, dep_type: 0 },
  },
  light_client_typescript: {
    code_hash: 'b0664a84bd9039cb75e77d03232b62e3bee24de7de4b44c8ccd8993bff44ef6c',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 3, dep_type: 0 },
  },
  recipient_typescript: {
    code_hash: 'd532d5f4a46fe8577ad3efc07fbdd12d866e89d4afe75588d76504996d00d600',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 2, dep_type: 0 },
  },
  simple_bridge_typescript: {
    code_hash: 'c38af159c9e67286051343b49ecdde8d0ffef9c00029b232a2ec4e17d1e75c7f',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 4, dep_type: 0 },
  },
  sudt: {
    code_hash: 'c5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
    hash_type: 1,
    outpoint: { tx_hash: 'e12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769', index: 0, dep_type: 0 },
  },
  light_client_cell_script: {
    cell_script:
      '59000000100000003000000031000000b0664a84bd9039cb75e77d03232b62e3bee24de7de4b44c8ccd8993bff44ef6c012400000036ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a205000000',
  },
  multisig_address: { addresses: ['ckt1qyqv608y8u9sjaclqtx4ul6fpzqes4hldjssgk25xj'], require_first_n: 0, threshold: 1 },
  ckb_relay_mutlisig_threshold: { threshold: 1 },
  pw_locks: {
    inner: [
      { tx_hash: '57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38', index: 0, dep_type: 0 },
      { tx_hash: 'f8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37', index: 0, dep_type: 1 },
    ],
  },
};
