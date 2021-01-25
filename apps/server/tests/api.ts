import axios from 'axios';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import * as commons from '@gliaswap/commons';
import dotenv from 'dotenv';
dotenv.config();
import { TokenHolderFactory } from '../src/model';
import * as config from '../src/config';
import CKBComponents from '@nervosnetwork/ckb-sdk-core/lib';

const AGGRON_LOCK_CODE_HASH = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8';
const AGGRON_SUDT_TYPE_CODE_HASH = '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4';
const AGGRON_SUDT_TX_HASH = '0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958';
const LIQUIDITY_ORDER_LOCK_CODE_HASH = process.env.LIQUIDITY_ORDER_LOCK_CODE_HASH || '0x000555';
const SWAP_ORDER_LOCK_CODE_HASH = process.env.SWAP_ORDER_LOCK_CODE_HASH || '0x000666';
const INFO_TYPE_CODE_HASH = process.env.INFO_TYPE_CODE_HASH || '0x000777';
const INFO_LOCK_CODE_HASH = process.env.INFO_LOCK_CODE_HASH || '0x000888';

const LIQUIDITY_ORDER_LOCK_DEP = {
  outPoint: {
    txHash: process.env.LIQUIDITY_ORDER_LOCK_DEP_TX_HASH || '0x000111',
    index: '0x00',
  },
  depType: 'code',
};
const SWAP_ORDER_LOCK_DEP = {
  outPoint: {
    txHash: process.env.SWAP_ORDER_LOCK_DEP_TX_HASH || '0x000222',
    index: '0x00',
  },
  depType: 'code',
};
const INFO_TYPE_DEP = {
  outPoint: {
    txHash: process.env.INFO_TYPE_DEP_TX_HASH || '0x000333',
    index: '0x00',
  },
  depType: 'code',
};
const INFO_LOCK_DEP = {
  outPoint: {
    txHash: process.env.INFO_LOCK_DEP_TX_HASH || '0x000444',
    index: '0x00',
  },
  depType: 'code',
};
const SUDT_TYPE_DEP = {
  outPoint: {
    txHash: process.env.SUDT_TYPE_DEP_TX_HASH || AGGRON_SUDT_TX_HASH,
    index: '0x00',
  },
  depType: 'code',
};
const USER_LOCK: CKBComponents.Script = {
  codeHash: AGGRON_LOCK_CODE_HASH,
  hashType: 'type',
  args: process.env.USER_LOCK_ARGS,
};
const TOKENS = ['GLIA', 'ckETH', 'ckDAI', 'ckUSDC', 'ckUSDT'];
const TOKEN_HOLDER = TokenHolderFactory.getInstance();

const ckbToken = (amount: bigint) => {
  return {
    balance: amount.toString(),
    typeHash: CKB_TYPE_HASH,
    typeScript: undefined,
    info: undefined,
  };
};

const generateToken = (amount: bigint, symbol: string) => {
  const token = TOKEN_HOLDER.getTokenBySymbol(symbol);

  return {
    balance: amount.toString(),
    typeHash: token.typeHash,
    typeScript: token.typeScript,
    info: token.info,
  };
};

const deserializeTransactionToSign = (serialized: commons.SerializedTransactonToSign) => {
  const inputs = serialized.inputCells.map((cell) => {
    return {
      previousOutput: {
        txHash: cell.txHash,
        index: cell.index,
      },
      since: '0x0',
    };
  });
  const outputs = serialized.outputCells.map((cell) => {
    return {
      capacity: cell.capacity,
      lock: cell.lock,
      type: cell.type,
    };
  });
  const outputsData = serialized.outputCells.map((cell) => {
    return cell.data;
  });

  const txToSign: CKBComponents.RawTransactionToSign = {
    version: serialized.version,
    cellDeps: serialized.cellDeps,
    headerDeps: serialized.headerDeps,
    inputs,
    outputs,
    witnesses: serialized.witnessArgs,
    outputsData,
  };

  return txToSign;
};

async function createTestPool(tokenSymbol: string) {
  const req = {
    tokenA: ckbToken(0n),
    tokenB: generateToken(0n, tokenSymbol),
    userLock: USER_LOCK,
  };

  console.log(req);

  try {
    const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/create-test', req);
    const tx = deserializeTransactionToSign(resp.data.tx);
    console.log(tx);
    console.log(resp.data.fee);
    console.log(resp.data.lpToken);
  } catch (e) {
    console.log(e.response.status);
    console.log(e.response.statusText);
    console.log(e.response.data);
  }
}

createTestPool('GLIA');
