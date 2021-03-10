import * as lumos from '@ckb-lumos/base';
import * as commons from '@gliaswap/commons';
import { MIN_SUDT_CAPACITY, CKB_DECIMAL } from '@gliaswap/constants';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { AddressPrefix, privateKeyToAddress, addressToScript } from '@nervosnetwork/ckb-sdk-utils';
import axios from 'axios';

import * as config from '../../src/config';
import {
  Script,
  CellInfoSerializationHolderFactory,
  Cell,
  cellConver,
  RawTransaction,
  TransactionToSign,
} from '../../src/model';
import { ckbRepository } from '../../src/repository';
import { hexBigint, minCKBChangeCapacity } from '../../src/service/txBuilderService/utils';

const USER_PRIV_KEY = process.env.USER_PRIV_KEY;
const USER_ADDRESS = privateKeyToAddress(USER_PRIV_KEY, {
  prefix: AddressPrefix.Testnet,
});
const USER_LOCK = addressToScript(USER_ADDRESS);

export interface CollectedCells {
  inputCells: Cell[];
  inputCapacity: bigint;
  inputToken?: bigint;
}

const collectFreeCkb = async (amount: bigint, userLock: Script): Promise<CollectedCells> => {
  const inputCells: Cell[] = [];
  let inputCapacity = 0n;

  const queryOptions: lumos.QueryOptions = {
    lock: userLock.toLumosScript(),
  };
  const cells = await ckbRepository.collectCells(queryOptions);

  // Filter non-free ckb cells
  const freeCells = cells.filter((cell) => cell.data === '0x' && !cell.cellOutput.type);
  for (const cell of freeCells) {
    if (inputCapacity >= amount) {
      break;
    }

    inputCells.push(cell);
    inputCapacity = inputCapacity + BigInt(cell.cellOutput.capacity);
  }
  if (inputCapacity < amount) {
    throw Error('ckb not enough');
  }

  return {
    inputCells,
    inputCapacity,
  };
};

const genIssueTokenTx = async (amount: bigint, txFee = 0n): Promise<TransactionToSign> => {
  const tokenCodec = CellInfoSerializationHolderFactory.getInstance().getSudtCellSerialization();

  const userLock = new Script(USER_LOCK.codeHash, USER_LOCK.hashType, USER_LOCK.args);

  const minCKBCapacity = minCKBChangeCapacity(userLock);
  const { inputCells, inputCapacity } = await collectFreeCkb(MIN_SUDT_CAPACITY + txFee, userLock);

  const tokenType = new Script(config.SUDT_TYPE_CODE_HASH, 'type', userLock.toHash());

  const tokenOutput = {
    capacity: hexBigint(amount),
    lock: userLock,
    type: tokenType,
  };
  const tokenData = tokenCodec.encodeData(amount);

  const ckbChangeCapacity = inputCapacity - MIN_SUDT_CAPACITY;
  const ckbChangeOutput = {
    capacity: hexBigint(ckbChangeCapacity),
    lock: userLock,
  };

  const outputs = [tokenOutput, ckbChangeOutput];
  const outputsData = [tokenData, '0x'];

  // Generate transaction
  const inputs = inputCells.map((cell) => {
    return cellConver.converToInput(cell);
  });
  const userLockDeps = config.LOCK_DEPS[userLock.codeHash];
  const cellDeps = [config.SUDT_TYPE_DEP].concat(userLockDeps);
  const witnessArgs = [config.SECP256K1_WITNESS_ARGS];
  const witnessLengths = [];
  const raw: RawTransaction = {
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    version: '0x0',
  };
  const txToSign = new TransactionToSign(raw, inputCells, witnessArgs, witnessLengths);

  const estimatedTxFee = txToSign.calcFee();
  if (ckbChangeCapacity - estimatedTxFee < minCKBCapacity) {
    return await genIssueTokenTx(amount, estimatedTxFee);
  }

  const changeOutput = txToSign.raw.outputs.pop();
  changeOutput.capacity = hexBigint(BigInt(changeOutput.capacity) - estimatedTxFee);
  txToSign.raw.outputs.push(changeOutput);

  return txToSign;
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

const ckb = new CKB(config.ckbConfig.nodeUrl);
const issueToken = async (amount: bigint) => {
  try {
    const txToSign = deserializeTransactionToSign(
      (await genIssueTokenTx(amount)).serialize() as commons.SerializedTransactonToSign,
    );
    const signedTx = ckb.signTransaction(USER_PRIV_KEY)(txToSign);

    const resp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', { signedTx });
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

issueToken(CKB_DECIMAL * CKB_DECIMAL);
