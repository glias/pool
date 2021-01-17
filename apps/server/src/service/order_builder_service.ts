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

import { ForgeCellService, DefaultForgeCellService } from '.';

export const SUDT_DEP = new CellDep(DepType.code, new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'));
export const LIQUIDITY_ORDER_LOCK_DEP = new CellDep(
  DepType.code,
  new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'),
);

export class OrderBuilderService {
  forgeCellService: ForgeCellService;

  constructor(service?: ForgeCellService) {
    this.forgeCellService = (service && service) || new DefaultForgeCellService();
  }

  public async buildGenesisLiquidity(
    ctx: Context,
    req: Server.GenesisLiquidityRequest,
    txFee: Amount = Amount.ZERO,
  ): Promise<Server.TransactionWithFee> {
    if (req.tokenAAmount.typeHash != CKB_TYPE_HASH && req.tokenBAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw('token/token pool isnt support yet', 400);
    }

    const tokenAmount = req.tokenAAmount.typeHash == CKB_TYPE_HASH ? req.tokenBAmount : req.tokenAAmount;
    const ckbAmount = req.tokenAAmount.typeHash == CKB_TYPE_HASH ? req.tokenAAmount : req.tokenBAmount;

    let outputs: Array<Cell> = [];
    const minOutputCapacity = new Amount(LIQUIDITY_ORDER_CAPACITY.toString()).add(new Amount(ckbAmount.balance));
    const { inputs, forgedOutput, changeOutput } = await this.forgeCellService.forgeToken(
      ctx,
      minOutputCapacity,
      tokenAmount,
      req.userLock,
      txFee,
    );

    const userLockHash = req.userLock.toHash();
    const version = '0x01'.slice(2);
    const amountPlaceHolder = new Amount('0').toUInt128LE().slice(2);
    const infoTypeHash20 = req.poolId.slice(2, 40);
    const orderLockScript = new Script(
      LIQUIDITY_ORDER_LOCK_CODE_HASH,
      `${userLockHash}${version}${amountPlaceHolder}${amountPlaceHolder}${infoTypeHash20}`,
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
      return await this.buildGenesisLiquidity(ctx, req, estimatedTxFee);
    }

    changeOutput.capacity = changeOutput.capacity.sub(estimatedTxFee);
    tx.raw.outputs.pop();
    tx.raw.outputs.push(changeOutput);
    return {
      pwTransaction: tx,
      fee: estimatedTxFee.toString(),
    };
  }

  public async buildAddLiquidity(
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
    const { inputs, forgedOutput, changeOutput } = await this.forgeCellService.forgeToken(
      ctx,
      minOutputCapacity,
      tokenDesiredAmount,
      req.userLock,
      txFee,
    );

    const userLockHash = req.userLock.toHash();
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
      return await this.buildAddLiquidity(ctx, req, estimatedTxFee);
    }

    changeOutput.capacity = changeOutput.capacity.sub(estimatedTxFee);
    tx.raw.outputs.pop();
    tx.raw.outputs.push(changeOutput);
    return {
      pwTransaction: tx,
      fee: estimatedTxFee.toString(),
    };
  }

  public async buildRemoveLiquidity(
    ctx: Context,
    req: Server.RemoveLiquidityRequest,
    txFee: Amount = Amount.ZERO,
  ): Promise<Server.TransactionWithFee> {
    if (req.tokenAMinAmount.typeHash != CKB_TYPE_HASH && req.tokenBMinAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw('token/token pool isnt support yet', 400);
    }

    let outputs: Array<Cell> = [];
    const minOutputCapacity = new Amount(LIQUIDITY_ORDER_CAPACITY.toString());
    const { inputs, forgedOutput, changeOutput } = await this.forgeCellService.forgeToken(
      ctx,
      minOutputCapacity,
      req.liquidityTokenAmount,
      req.userLock,
      txFee,
    );

    const userLockHash = req.userLock.toHash();
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
      return await this.buildRemoveLiquidity(ctx, req, estimatedTxFee);
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
}
