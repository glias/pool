import axios, { AxiosResponse } from 'axios';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { AddressPrefix, privateKeyToAddress, addressToScript } from '@nervosnetwork/ckb-sdk-utils';
import { CKB_TYPE_HASH, CKB_DECIMAL } from '@gliaswap/constants';
import * as commons from '@gliaswap/commons';
import dotenv from 'dotenv';
dotenv.config();

import { TokenHolderFactory } from '../../src/model';
import { txBuilder } from '../../src/service';
import * as config from '../../src/config';

const USER_PRIV_KEY = process.env.USER_PRIV_KEY;
const USER_ADDRESS = privateKeyToAddress(USER_PRIV_KEY, {
  prefix: AddressPrefix.Testnet,
});
const USER_LOCK = addressToScript(USER_ADDRESS);

const ROOT_URL = 'http://127.0.0.1:3000/v1';
const LIQUIDITY_ROOT_URL = `${ROOT_URL}/liquidity-pool`;
const CREATE_POOL_URL = `${LIQUIDITY_ROOT_URL}/create`;
const GENESIS_LIQUIDITY_URL = `${LIQUIDITY_ROOT_URL}/orders/genesis-liquidity`;
const ADD_LIQUIDITY_URL = `${LIQUIDITY_ROOT_URL}/orders/add-liquidity`;
const REMOVE_LIQUIDITY_URL = `${LIQUIDITY_ROOT_URL}/orders/remove-liquidity`;
const CANCEL_LIQUIDITY_REQUEST_URL = `${LIQUIDITY_ROOT_URL}/orders/cancel`;
const SWAP_URL = `${ROOT_URL}/swap/orders/swap`;
const CANCEL_SWAP_REQUEST_URL = `${ROOT_URL}/swap/orders/cancel`;

const TOKEN_HOLDER = TokenHolderFactory.getInstance();

const ckbToken = (amount: bigint) => {
  const token = TOKEN_HOLDER.getTokenBySymbol('CKB');

  return {
    balance: amount.toString(),
    typeHash: CKB_TYPE_HASH,
    ...token.info,
  };
};

const generateToken = (amount: bigint, symbol: string) => {
  const token = TOKEN_HOLDER.getTokenBySymbol(symbol);

  return {
    balance: amount.toString(),
    typeHash: token.typeHash,
    ...token.info,
  };
};

const generateLPToken = (amount: bigint, tokenSymbol: string) => {
  const token = TOKEN_HOLDER.getTokenBySymbol(tokenSymbol);
  const infoTypeScriptArgs = config.POOL_ID[tokenSymbol];

  const lpTokenTypeScript = txBuilder.TxBuilderService.lpTokenTypeScript(infoTypeScriptArgs, token.typeHash);

  return {
    balance: amount.toString(),
    typeHash: lpTokenTypeScript.toHash(),
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

type postCallback = (resp: AxiosResponse) => void;

const postRequest = async (url: string, req: Record<string, unknown>, callback?: postCallback) => {
  try {
    let resp = await axios.post(url, req);
    const tx = deserializeTransactionToSign(resp.data.tx);
    // console.log(JSON.stringify(txToSign, null, 2));

    if (callback) {
      callback(resp);
    }

    const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
    // console.log(JSON.stringify(signedTx, null, 2));

    resp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', { signedTx });
    console.log(`tx hash: ${resp.data.txHash}`);
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
};

async function createTestPool(tokenSymbol: string) {
  if (!config.POOL_ID[tokenSymbol]) {
    throw new Error(`unknown token symbol: ${tokenSymbol}`);
  }
  console.log(`create ${tokenSymbol} pool, id: ${config.POOL_ID[tokenSymbol]}`);

  const lpToken = generateLPToken(0n, tokenSymbol);
  console.log(`expect lp token type hash ${lpToken.typeHash}`);

  const req = {
    assets: [ckbToken(0n), generateToken(0n, tokenSymbol)],
    lock: USER_LOCK,
  };

  await postRequest(CREATE_POOL_URL, req, (resp) => {
    if (resp.data.lpToken.typeHash != lpToken.typeHash) {
      throw new Error(`lp token type hash ${resp.data.lpToken.typeHash} dont match`);
    }
  });
}

async function createGenesisTx(tokenSymbol: string) {
  if (!config.POOL_ID[tokenSymbol]) {
    throw new Error(`unknown token symbol: ${tokenSymbol}`);
  }
  console.log(`create ${tokenSymbol} genesis, id: ${config.POOL_ID[tokenSymbol]}`);

  const req = {
    assets: [ckbToken(10n * CKB_DECIMAL), generateToken(10n * CKB_DECIMAL, tokenSymbol)],
    poolId: config.POOL_ID[tokenSymbol],
    lock: USER_LOCK,
    tips: ckbToken(0n),
  };

  await postRequest(GENESIS_LIQUIDITY_URL, req);
}

async function createAddLiquidityTx(tokenSymbol: string) {
  if (!config.POOL_ID[tokenSymbol]) {
    throw new Error(`unknown token symbol: ${tokenSymbol}`);
  }
  console.log(`create ${tokenSymbol} add liquidity, id: ${config.POOL_ID[tokenSymbol]}`);

  const req = {
    assetsWithDesiredAmount: [ckbToken(1000n * CKB_DECIMAL), generateToken(300n * CKB_DECIMAL, tokenSymbol)],
    assetsWithMinAmount: [ckbToken(100n * CKB_DECIMAL), generateToken(100n * CKB_DECIMAL, tokenSymbol)],
    poolId: config.POOL_ID[tokenSymbol],
    lock: USER_LOCK,
    tips: ckbToken(0n),
  };

  await postRequest(ADD_LIQUIDITY_URL, req);
}

async function createRemoveLiquidityTx(tokenSymbol: string) {
  if (!config.POOL_ID[tokenSymbol]) {
    throw new Error(`unknown token symbol: ${tokenSymbol}`);
  }
  console.log(`create ${tokenSymbol} remove liquidity, id: ${config.POOL_ID[tokenSymbol]}`);

  const req = {
    assetsWithMinAmount: [ckbToken(10n * CKB_DECIMAL), generateToken(10n * CKB_DECIMAL, tokenSymbol)],
    lpToken: generateLPToken(50n * CKB_DECIMAL, tokenSymbol),
    poolId: config.POOL_ID[tokenSymbol],
    lock: USER_LOCK,
    tips: ckbToken(0n),
  };

  await postRequest(REMOVE_LIQUIDITY_URL, req);
}

async function createCancelLiquidityTx(txHash: string) {
  if (!txHash) {
    console.log('no liquidty request tx hash to cancel');
  }

  console.log(`create cancel liquidity, txHash: ${txHash}`);

  const req = {
    txHash,
    lock: USER_LOCK,
  };

  await postRequest(CANCEL_LIQUIDITY_REQUEST_URL, req);
}

async function createSwapTx(tokenSymbol: string) {
  if (!config.POOL_ID[tokenSymbol]) {
    throw new Error(`unknown token symbol: ${tokenSymbol}`);
  }
  console.log(`create ${tokenSymbol} swap, id: ${config.POOL_ID[tokenSymbol]}`);

  // const req = {
  //   assetInWithAmount: ckbToken(100n * CKB_DECIMAL),
  //   assetOutWithMinAmount: generateToken(5n * CKB_DECIMAL, tokenSymbol),
  //   lock: USER_LOCK,
  //   tips: ckbToken(0n),
  // };
  const req = {
    assetInWithAmount: generateToken(10n * CKB_DECIMAL, tokenSymbol),
    assetOutWithMinAmount: ckbToken(2n * CKB_DECIMAL),
    lock: USER_LOCK,
    tips: ckbToken(0n),
  };

  await postRequest(SWAP_URL, req);
}

async function createCancelSwapTx(txHash: string) {
  if (!txHash) {
    console.log('no swap request tx hash to cancel');
  }

  console.log(`create cancel swap, txHash: ${txHash}`);

  const req = {
    txHash,
    lock: USER_LOCK,
  };

  await postRequest(CANCEL_SWAP_REQUEST_URL, req);
}

const ckb = new CKB(config.ckbConfig.nodeUrl);
console.log(`use address: ${USER_ADDRESS}`);
// const TOKENS = ['GLIA', 'ckETH', 'ckDAI', 'ckUSDC', 'ckUSDT'];
const token = 'Undefined';
const lpReqTxHash = undefined;
const swapReqTxHash = undefined;

async function main() {
  createTestPool(token);
  createGenesisTx(token);
  createAddLiquidityTx(token);
  createRemoveLiquidityTx(token);
  createCancelLiquidityTx(lpReqTxHash);
  createSwapTx(token);
  createCancelSwapTx(swapReqTxHash);
}

main();
