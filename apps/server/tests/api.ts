import axios from 'axios';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import * as commons from '@gliaswap/commons';
import dotenv from 'dotenv';
dotenv.config();
import { TokenHolderFactory } from '../src/model';
import * as config from '../src/config';
import CKBComponents from '@nervosnetwork/ckb-sdk-core/lib';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils';

const USER_PRIV_KEY = process.env.USER_PRIV_KEY;
const USER_LOCK: CKBComponents.Script = {
  codeHash: config.SECP256K1_LOCK_CODE_HASH,
  hashType: 'type',
  args: process.env.USER_LOCK_ARGS,
};
const TOKENS = ['GLIA', 'ckETH', 'ckDAI', 'ckUSDC', 'ckUSDT'];
const POOL_IDS = {
  GLIA: '0xeff0c7b3706be915f6a1ec798db16c673b7c683a39af099305a5fd467b993251',
};
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

  // console.log(req);

  try {
    const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/create-test', req);
    const tx = deserializeTransactionToSign(resp.data.tx);
    // console.log(JSON.stringify(tx, null, 2));
    console.log(resp.data.fee);
    console.log(resp.data.lpToken);

    // console.log(tx.witnesses);
    const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
    // console.log(JSON.stringify(signedTx, null, 2));

    const sendTxReq = {
      signedTx: signedTx,
    };
    const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
    console.log(sendResp.data.txHash);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response) {
        console.log(e.response.status);
        console.log(e.response.statusText);
        console.log(e.response.data);
      } else {
        console.log(e.message);
      }
    } else {
      console.log(e);
    }
  }
}

async function createGenesisTx(tokenSymbol: string) {
  const req = {
    tokenAAmount: ckbToken(100n),
    tokenBAmount: generateToken(100n, tokenSymbol),
    poolId: POOL_IDS[tokenSymbol],
    userLock: USER_LOCK,
    tips: ckbToken(0n),
  };

  console.log(req);

  try {
    const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/orders/genesis-liquidity', req);
    const tx = deserializeTransactionToSign(resp.data.tx);
    // console.log(JSON.stringify(tx, null, 2));
    // console.log(resp.data.fee);

    const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
    // console.log(JSON.stringify(signedTx, null, 2));

    const sendTxReq = {
      signedTx: signedTx,
    };
    const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
    console.log(sendResp.data.txHash);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response) {
        console.log(e.response.status);
        console.log(e.response.statusText);
        console.log(e.response.data);
      } else {
        console.log(e.message);
      }
    } else {
      console.log(e);
    }
  }
}

const ckb = new CKB(config.ckbConfig.nodeUrl);
const address = ckb.utils.privateKeyToAddress(USER_PRIV_KEY, { prefix: AddressPrefix.Testnet });
console.log(`use address: ${address}`);

// createTestPool('GLIA');
createGenesisTx('GLIA');
