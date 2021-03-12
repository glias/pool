import { Context } from 'koa';

import * as config from '../../config';
import { Cell, RawTransaction, cellConver, Output, TransactionToSign, CellDep } from '../../model';
import { DexRepository } from '../../repository';
import { CellCollector } from './collector';
import { CancelRequest, TransactionWithFee } from './requestResponse';
import * as txBuilderUtils from './utils';

export type CodeHash = string;

export async function buildCancelReq(
  ctx: Context,
  req: CancelRequest,
  lockMap: Map<CodeHash, CellDep>,
  dexRepository: DexRepository,
  cellCollector: CellCollector,
  txFee = 0n,
): Promise<TransactionWithFee> {
  const requestCells = await extractRequest(ctx, dexRepository, req.txHash, Array.from(lockMap.keys()));

  const requestCapacity = requestCells
    .map((cell: Cell) => BigInt(cell.cellOutput.capacity))
    .reduce((accuCap, curCap) => accuCap + curCap);
  const requestDeps = (() => {
    const codeHashes = requestCells.map((cell: Cell) => {
      return cell.cellOutput.lock.codeHash;
    });
    const uniqCodeHashes = [...new Set(codeHashes)];
    return uniqCodeHashes.map((codeHash: string) => lockMap.get(codeHash));
  })();

  const tokenCells = requestCells.filter((cell: Cell) => {
    return cell.cellOutput.type && cell.cellOutput.type.codeHash == config.SUDT_TYPE_CODE_HASH;
  });

  const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
  const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, tokenCells[0].cellOutput.type);
  const minCapacity = minCKBChangeCapacity + txFee;

  const collectedCells = await cellCollector.collect(ctx, minCapacity, req.userLock);
  const inputCapacity = requestCapacity + collectedCells.inputCapacity;

  const outputs: Output[] = [];
  const outputsData: string[] = [];

  for (const cell of tokenCells) {
    const tokenChangeOutput = {
      capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
      lock: req.userLock,
      type: cell.cellOutput.type,
    };

    outputs.push(tokenChangeOutput);
    outputsData.push(cell.data);
  }

  const ckbChangeCapacity = inputCapacity - minTokenChangeCapacity * BigInt(tokenCells.length);
  let ckbChangeOutput = {
    capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
    lock: req.userLock,
  };

  outputs.push(ckbChangeOutput);
  outputsData.push('0x');

  const inputs = collectedCells.inputCells.concat(requestCells).map((cell) => {
    return cellConver.converToInput(cell);
  });
  const inputCells = collectedCells.inputCells.concat(requestCells);

  const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
  const cellDeps = [config.SUDT_TYPE_DEP, ...requestDeps].concat(userLockDeps);
  const witnessArgs =
    req.userLock.codeHash == config.PW_LOCK_CODE_HASH
      ? [config.PW_WITNESS_ARGS.Secp256k1]
      : [config.SECP256K1_WITNESS_ARGS];
  const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];

  const raw: RawTransaction = {
    version: '0x0',
    headerDeps: [],
    cellDeps,
    inputs,
    outputs,
    outputsData,
  };
  const txToSign = new TransactionToSign(raw, inputCells, witnessArgs, witnessLengths);

  const estimatedTxFee = txToSign.calcFee();
  if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
    return await buildCancelReq(ctx, req, lockMap, dexRepository, cellCollector, estimatedTxFee);
  }

  ckbChangeOutput = txToSign.raw.outputs.pop();
  ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
  txToSign.raw.outputs.push(ckbChangeOutput);

  return new TransactionWithFee(txToSign, estimatedTxFee);
}

async function extractRequest(
  ctx: Context,
  dexRepository: DexRepository,
  txHash: string,
  lockCodeHashes: string[],
): Promise<Cell[]> {
  const { transaction } = await dexRepository.getTransaction(txHash);
  const outputCells = transaction.outputs.map((output: Output, idx: number) => {
    if (!lockCodeHashes.includes(output.lock.codeHash)) {
      return undefined;
    }

    return {
      cellOutput: output,
      outPoint: {
        txHash: transaction.hash,
        index: `0x${idx.toString(16)}`,
      },
      blockHash: null,
      blockNumber: null,
      data: transaction.outputsData[idx],
    };
  });

  const cells = outputCells.filter((cell: Cell) => cell != undefined);
  if (cells.length == 0) {
    ctx.throw(404, `request not found in transaction ${txHash}`);
  }

  return cells;
}
