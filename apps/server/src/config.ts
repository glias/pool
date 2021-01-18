import { CellDep, OutPoint, DepType } from '@lay2/pw-core';
import dotenv from 'dotenv';
import { MySqlConnectionConfig } from 'knex';
dotenv.config();

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
export const INFO_TYPE_CODE_HASH = process.env.INFO_TYPE_CODE_HASH;
export const INFO_LOCK_CODE_HASH = process.env.INFO_LOCK_CODE_HASH;
export const SUDT_TYPE_CODE_HASH = process.env.SUDT_TYPE_CODE_HASH;

export const LIQUIDITY_ORDER_LOCK_DEP = (() => {
  const outPoint = new OutPoint(process.env.LIQUIDITY_ORDER_LOCK_DEP_TX_HASH, '0x0');
  return new CellDep(DepType.code, outPoint);
})();
export const SWAP_ORDER_LOCK_DEP = (() => {
  const outPoint = new OutPoint(process.env.SWAP_ORDER_LOCK_DEP_TX_HASH, '0x0');
  return new CellDep(DepType.code, outPoint);
})();
export const INFO_TYPE_DEP = (() => {
  const outPoint = new OutPoint(process.env.INFO_TYPE_DEP_TX_HASH, '0x0');
  return new CellDep(DepType.code, outPoint);
})();
export const INFO_LOCK_DEP = (() => {
  const outPoint = new OutPoint(process.env.INFO_LOCK_DEP_TX_HASH, '0x0');
  return new CellDep(DepType.code, outPoint);
})();
export const SUDT_TYPE_DEP = (() => {
  const outPoint = new OutPoint(process.env.SUDT_TYPE_DEP_TX_HASH, '0x0');
  return new CellDep(DepType.code, outPoint);
})();
