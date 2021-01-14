import { Server } from '@gliaswap/types';
import {
  MIN_SUDT_CAPACITY,
  LIQUIDITY_ORDER_CAPACITY,
  CKB_TYPE_HASH,
  LIQUIDITY_ORDER_LOCK_CODE_HASH,
} from '@gliaswap/constants';
import {
  Transaction,
  RawTransaction,
  Builder,
  Amount,
  Cell,
  Script,
  HashType,
  CellDep,
  DepType,
  OutPoint,
} from '@lay2/pw-core';
import { Context } from 'koa';

import { ICellCollector } from './cellCollector';

export const SUDT_DEP = new CellDep(DepType.code, new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'));
export const LIQUIDITY_ORDER_LOCK_DEP = new CellDep(
  DepType.code,
  new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'),
);

interface ForgedCell {
  inputs: Array<Cell>;
  forgedOutput: Cell;
  changeOutput: Cell;
}

export class OrderBuilder {
  cellCollector: ICellCollector;

  constructor(cellCollector: ICellCollector) {
    this.cellCollector = cellCollector;
  }

  public async buildAddLiquidityOrder(
    ctx: Context,
    req: Server.AddLiquidityRequest,
    txFee: Amount = Amount.ZERO,
  ): Promise<Server.TransactionWithFee> {
    if (req.tokenADesiredAmount.typeHash != CKB_TYPE_HASH && req.tokenBDesiredAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw('token/token pool isnt support yet', 400);
    }

    const tokenDesiredAmount =
      req.tokenADesiredAmount.typeHash == CKB_TYPE_HASH ? req.tokenBDesiredAmount : req.tokenADesiredAmount;
    const ckbDesiredAmount =
      req.tokenADesiredAmount.typeHash == CKB_TYPE_HASH ? req.tokenADesiredAmount : req.tokenBDesiredAmount;

    let outputs: Array<Cell> = [];
    const minOutputCapacity = new Amount(LIQUIDITY_ORDER_CAPACITY.toString()).add(new Amount(ckbDesiredAmount.balance));
    const { inputs, forgedOutput, changeOutput } = await this.forgeCell(
      ctx,
      minOutputCapacity,
      tokenDesiredAmount,
      req.userLockScript,
      txFee,
    );

    const userLockHash = req.userLockScript.toHash();
    const version = '0x01'.slice(2);
    const tokenAMinAmount = new Amount(req.tokenAMinAmount.balance).toUInt128LE().slice(2);
    const tokenBMinAmount = new Amount(req.tokenBMinAmount.balance).toUInt128LE().slice(2);
    const infoTypeHash20 = req.poolId.slice(2, 40);
    const orderLockScript = new Script(
      LIQUIDITY_ORDER_LOCK_CODE_HASH,
      `${userLockHash}${version}${tokenAMinAmount}${tokenBMinAmount}${infoTypeHash20}`,
      HashType.type,
    );

    // Order data is passed through lock args
    forgedOutput.lock = orderLockScript;
    outputs.push(forgedOutput);
    outputs.push(changeOutput);

    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1]);
    tx.raw.cellDeps.concat([SUDT_DEP, LIQUIDITY_ORDER_LOCK_DEP]);

    // TODO: add a hardcode tx fee in first run to avoid too deep recursives
    const estimatedTxFee = Builder.calcFee(tx);
    if (!this.isChangeCoverTxFee(changeOutput, estimatedTxFee)) {
      return await this.buildAddLiquidityOrder(ctx, req, estimatedTxFee);
    }

    changeOutput.capacity = changeOutput.capacity.sub(estimatedTxFee);
    tx.raw.outputs.pop();
    tx.raw.outputs.push(changeOutput);
    return {
      pwTransaction: tx,
      fee: estimatedTxFee.toString(),
    };
  }

  isChangeCoverTxFee(changeCell: Cell, txFee: Amount): boolean {
    // If no type script, ensure we have a change cell, so that
    // txFee won't be changed.
    return (
      (changeCell.type != undefined && changeCell.capacity.gte(new Amount(MIN_SUDT_CAPACITY.toString()).add(txFee))) ||
      (changeCell.type == undefined && changeCell.capacity.gt(txFee))
    );
  }

  // TODO: check token.script exists
  // FIXME: make sure that capacity is bigger or equal than MIN_SUDT_CAPACITY
  async forgeCell(
    ctx: Context,
    capacity: Amount,
    token: Server.Token,
    userLock: Script,
    extraCapacity: Amount = Amount.ZERO,
  ): Promise<ForgedCell> {
    let inputs: Array<Cell> = [];
    let inputTokenAmount = Amount.ZERO;
    let inputCapacity = Amount.ZERO;
    const tokenAmount = new Amount(token.balance);

    const tokenLiveCells = await this.cellCollector.collect(token, userLock);
    tokenLiveCells.forEach((cell) => {
      inputTokenAmount = inputTokenAmount.add(cell.getSUDTAmount());
      inputs.push(cell);
      inputCapacity = inputCapacity.add(cell.capacity);
    });
    if (inputTokenAmount.lt(tokenAmount)) {
      ctx.throw('free sudt not enough', 400, { required: token.balance });
    }

    let minOutputCapacity = capacity.add(extraCapacity);
    const hasTokenChange = inputTokenAmount.gt(new Amount(token.balance));
    if (hasTokenChange) {
      // Need to generate a sudt change output cell
      minOutputCapacity = minOutputCapacity.add(new Amount(MIN_SUDT_CAPACITY.toString()));
    }

    // More capacities to ensure that we can cover extraCapacity
    if (inputCapacity.lte(minOutputCapacity)) {
      const extraNeededCapacity: Server.Token = {
        balance: minOutputCapacity.sub(inputCapacity).toString(),
        typeHash: CKB_TYPE_HASH,
        typeScript: undefined,
        info: undefined,
      };
      const ckbLiveCells = await this.cellCollector.collect(extraNeededCapacity, userLock);
      ckbLiveCells.forEach((cell) => {
        if (inputCapacity.lte(minOutputCapacity)) {
          inputs.push(cell);
          inputCapacity = inputCapacity.add(cell.capacity);
        }
      });
    }
    if (inputCapacity.lt(minOutputCapacity)) {
      ctx.throw('free ckb not enough', 400, { required: minOutputCapacity.toString() });
    }

    let forgedCell = new Cell(capacity, userLock, token.typeScript);
    forgedCell.setHexData(tokenAmount.toUInt128LE());

    let changeCell: Cell;
    const changeCapacity = inputCapacity.sub(capacity);
    if (hasTokenChange) {
      changeCell = new Cell(changeCapacity, userLock, token.typeScript);
      changeCell.setHexData(inputTokenAmount.sub(tokenAmount).toUInt128LE());
    } else {
      changeCell = new Cell(changeCapacity, userLock);
    }

    return {
      inputs,
      forgedOutput: forgedCell,
      changeOutput: changeCell,
    };
  }
}
