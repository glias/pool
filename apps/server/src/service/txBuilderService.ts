import { Server } from '@gliaswap/types';
import {
  MIN_SUDT_CAPACITY,
  LIQUIDITY_ORDER_CAPACITY,
  CKB_TYPE_HASH,
  SWAP_ORDER_CAPACITY,
  ORDER_VERSION,
  LIQUIDITY_ORDER_LOCK_CODE_HASH,
  INFO_TYPE_CODE_HASH,
  SWAP_ORDER_LOCK_CODE_HASH,
  ORDER_TYPE,
  INFO_CAPACITY,
  MIN_POOL_CAPACITY,
  INFO_LOCK_CODE_HASH,
  SUDT_TYPE_CODE_HASH,
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
  Blake2bHasher,
} from '@lay2/pw-core';
import { Context } from 'koa';

import { ForgeCellService, DefaultForgeCellService } from '.';
import { ckbRepository, DexRepository } from '../repository';
import { TokenCellCollectorService, DefaultTokenCellCollectorService } from '../service';
import * as model from '../model';

export const SUDT_DEP = new CellDep(DepType.code, new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'));
export const LIQUIDITY_ORDER_LOCK_DEP = new CellDep(
  DepType.code,
  new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'),
);
export const SWAP_ORDER_LOCK_DEP = new CellDep(
  DepType.code,
  new OutPoint(process.env.REACT_APP_SUDT_DEP_OUT_POINT!, '0x0'),
);

export const enum CancelOrderType {
  Liquidity,
  Swap,
}

export class TxBuilderService {
  private readonly forgeCellService: ForgeCellService;
  private readonly dexRepository: DexRepository;
  private readonly tokenCellCollectorService: TokenCellCollectorService;
  private readonly hasher: Blake2bHasher;

  constructor(service?: ForgeCellService, repository?: DexRepository, tokenCollector?: TokenCellCollectorService) {
    this.forgeCellService = service ? service : new DefaultForgeCellService();
    this.dexRepository = repository ? repository : ckbRepository;
    this.tokenCellCollectorService = tokenCollector ? tokenCollector : new DefaultTokenCellCollectorService();
    this.hasher = new Blake2bHasher();
  }

  public async buildCreateLiquidityPool(
    ctx: Context,
    req: Server.CreateLiquidityPoolRequest,
    txFee: Amount = Amount.ZERO,
  ): Promise<Server.CreateLiquidityPoolResponse> {
    if (req.tokenA.typeHash != CKB_TYPE_HASH && req.tokenB.typeHash != CKB_TYPE_HASH) {
      ctx.throw('token/token pool isnt support yet', 400);
    }

    const minOutputCapacity = new Amount(INFO_CAPACITY.toString())
      .add(new Amount(MIN_POOL_CAPACITY.toString()))
      .add(txFee);

    let inputCapacity = Amount.ZERO;
    let inputs: Array<Cell> = [];
    const cells = await this.tokenCellCollectorService.collectFreeCkb(req.userLock);
    cells.forEach((cell) => {
      if (inputCapacity.lt(minOutputCapacity)) {
        inputs.push(cell);
        inputCapacity = inputCapacity.add(cell.capacity);
      }
    });
    if (inputCapacity.lt(minOutputCapacity)) {
      ctx.throw('free ckb not enough', 400, { required: minOutputCapacity.toString() });
    }
    if (!inputs[0].outPoint) {
      ctx.throw('create pool failed, first input donest have outpoint', 500);
    }

    const { infoCell, liquidityTokenTypeScript } = (() => {
      const id = (() => {
        this.hasher.reset();
        this.hasher.update(inputs[0].outPoint.txHash);
        this.hasher.update('0x00');
        return this.hasher.digest().serializeJson();
      })();
      const type = new Script(INFO_TYPE_CODE_HASH, id, HashType.type);

      const pairedHash = (() => {
        const tokenTypeHash = req.tokenA.typeHash != CKB_TYPE_HASH ? req.tokenA.typeHash : req.tokenB.typeHash;

        this.hasher.reset();
        this.hasher.update('ckb');
        this.hasher.update(tokenTypeHash);
        return this.hasher.digest().serializeJson();
      })();
      const typeHash20 = type.toHash().slice(2).slice(20); // Strip first '0x' then our 20 bytes
      const lockArgs = `${pairedHash}${typeHash20}`;
      const lock = new Script(INFO_LOCK_CODE_HASH, lockArgs, HashType.type);

      const ckbReserve = '0x00';
      const tokenReserve = '0x00'.slice(2);
      const totalLiquidity = '0x00'.slice(2);
      const liquidityTokenTypeScript = new Script(SUDT_TYPE_CODE_HASH, lock.toHash(), HashType.type);
      const liquidityTokenTypeHash20 = liquidityTokenTypeScript.toHash().slice(2).slice(20);
      const data = `${ckbReserve}${tokenReserve}${totalLiquidity}${liquidityTokenTypeHash20}`;

      const infoCell = new Cell(new Amount(INFO_CAPACITY.toString()), lock, type, undefined, data);

      return {
        infoCell,
        liquidityTokenTypeScript,
      };
    })();

    const poolCell = (() => {
      const data = '0x00';
      const token = req.tokenA.typeHash != CKB_TYPE_HASH ? req.tokenA : req.tokenB;

      return new Cell(new Amount(MIN_POOL_CAPACITY.toString()), infoCell.lock, token.typeScript, undefined, data);
    })();

    const changeCell = new Cell(inputCapacity.sub(infoCell.capacity).sub(poolCell.capacity), req.userLock);

    const outputs = [infoCell, poolCell, changeCell];
    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1]);
    tx.raw.cellDeps.concat([SUDT_DEP, LIQUIDITY_ORDER_LOCK_DEP]);

    // TODO: add a hardcode tx fee in first run to avoid too deep recursives
    const estimatedTxFee = Builder.calcFee(tx);
    if (!this.isChangeCoverTxFee(changeCell, estimatedTxFee)) {
      return await this.buildCreateLiquidityPool(ctx, req, estimatedTxFee);
    }

    changeCell.capacity = changeCell.capacity.sub(estimatedTxFee);
    tx.raw.outputs.pop();
    tx.raw.outputs.push(changeCell);

    return {
      pwTransaction: tx,
      fee: estimatedTxFee.toString(),
      liquidityTokenTypeScript,
    };
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
    const version = ORDER_VERSION.slice(2);
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
    const version = ORDER_VERSION.slice(2);
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
    const version = ORDER_VERSION.slice(2);
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

  public async buildSwap(
    ctx: Context,
    req: Server.SwapOrderRequest,
    txFee: Amount = Amount.ZERO,
  ): Promise<Server.TransactionWithFee> {
    if (req.tokenInAmount.typeHash != CKB_TYPE_HASH && req.tokenOutMinAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw('token/token pool isnt support yet', 400);
    }

    const tokenAmount = req.tokenInAmount.typeHash == CKB_TYPE_HASH ? req.tokenOutMinAmount : req.tokenInAmount;
    const ckbAmount = req.tokenInAmount.typeHash == CKB_TYPE_HASH ? req.tokenInAmount : req.tokenOutMinAmount;

    let outputs: Array<Cell> = [];
    const minOutputCapacity = new Amount(ckbAmount.balance).add(new Amount(SWAP_ORDER_CAPACITY.toString()));
    const { inputs, forgedOutput, changeOutput } = await this.forgeCellService.forgeToken(
      ctx,
      minOutputCapacity,
      tokenAmount,
      req.userLock,
      txFee,
    );

    const userLockHash = req.userLock.toHash();
    const version = ORDER_VERSION.slice(2);
    const tokenInAmount = new Amount(req.tokenInAmount.balance).toUInt128LE().slice(2);
    const tokenOutMinAmount = new Amount(req.tokenOutMinAmount.balance).toUInt128LE().slice(2);
    const orderType =
      req.tokenInAmount.typeHash == CKB_TYPE_HASH ? ORDER_TYPE.SellCKB.slice(2) : ORDER_TYPE.BuyCKB.slice(2);
    const orderLockScript = new Script(
      SWAP_ORDER_LOCK_CODE_HASH,
      `${userLockHash}${version}${tokenInAmount}${tokenOutMinAmount}${orderType}`,
      HashType.type,
    );

    forgedOutput.lock = orderLockScript;
    outputs.push(forgedOutput);
    outputs.push(changeOutput);

    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1]);
    tx.raw.cellDeps.concat([SUDT_DEP, SWAP_ORDER_LOCK_DEP]);

    // TODO: add a hardcode tx fee in first run to avoid too deep recursives
    const estimatedTxFee = Builder.calcFee(tx);
    if (!this.isChangeCoverTxFee(changeOutput, estimatedTxFee)) {
      return await this.buildSwap(ctx, req, estimatedTxFee);
    }

    changeOutput.capacity = changeOutput.capacity.sub(estimatedTxFee);
    tx.raw.outputs.pop();
    tx.raw.outputs.push(changeOutput);
    return {
      pwTransaction: tx,
      fee: estimatedTxFee.toString(),
    };
  }

  // FIXME:
  public async buildCancelOrder(
    ctx: Context,
    req: Server.CancelOrderRequest,
    type: CancelOrderType,
    txFee: Amount = Builder.MIN_CHANGE,
  ): Promise<Server.TransactionWithFee> {
    const { transaction } = await this.dexRepository.getTransaction(req.txHash);
    const orderLockCodeHash =
      type == CancelOrderType.Liquidity ? LIQUIDITY_ORDER_LOCK_CODE_HASH : SWAP_ORDER_LOCK_CODE_HASH;
    const orderDep = type == CancelOrderType.Liquidity ? LIQUIDITY_ORDER_LOCK_DEP : SWAP_ORDER_LOCK_DEP;

    const idx = transaction.outputs.findIndex((value) => value.lock.codeHash == orderLockCodeHash);
    if (!idx) {
      ctx.throw('transaction not found', 404, { txHash: req.txHash });
    }
    if (!transaction.outputs[idx].type) {
      ctx.throw('order cell doesnt have type script', 400, { txHash: req.txHash });
    }

    const orderInput = this.createOrderInput(transaction, idx);

    let inputCapacity = Amount.ZERO;
    let inputs: Array<Cell> = [];
    const cells = await this.tokenCellCollectorService.collectFreeCkb(req.userLock);
    cells.forEach((cell) => {
      if (inputCapacity.lt(txFee)) {
        inputs.push(cell);
        inputCapacity = inputCapacity.add(cell.capacity);
      }
    });

    inputCapacity = inputCapacity.add(orderInput.capacity);
    inputs.push(orderInput);

    // FIXME: user lock maybe bigger than order lock.
    // FIXME: Fixed this sudt capacity to exactly its size and give use free ckb
    const tokenOutput = new Cell(
      inputCapacity.sub(txFee),
      req.userLock,
      orderInput.type,
      undefined,
      orderInput.getHexData(),
    );

    const outputs = [tokenOutput];
    const tx = new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1]);
    tx.raw.cellDeps.concat([SUDT_DEP, orderDep]);

    const estimatedTxFee = Builder.calcFee(tx);
    if (estimatedTxFee.lt(txFee)) {
      tokenOutput.capacity.add(txFee.sub(estimatedTxFee));
      tx.raw.outputs.pop();
      tx.raw.outputs.push(tokenOutput);
    }

    return {
      pwTransaction: tx,
      fee: estimatedTxFee.toString(),
    };
  }

  private createOrderInput(tx: model.Transaction, idx: number): Cell {
    const output = tx.outputs[idx];
    const capacity = new Amount(output.capacity);
    const lock = model.cellConver.converToPWScript(output.lock);
    const type = model.cellConver.converToPWScript(output.type);
    const outPoint = new OutPoint(tx.hash, idx.toString(16));

    return new Cell(capacity, lock, type, outPoint, tx.outputsData[idx]);
  }

  private isChangeCoverTxFee(changeCell: Cell, txFee: Amount): boolean {
    // If no type script, ensure we have a change cell, so that
    // txFee won't be changed.
    return (
      (changeCell.type != undefined && changeCell.capacity.gte(new Amount(MIN_SUDT_CAPACITY.toString()).add(txFee))) ||
      (changeCell.type == undefined && changeCell.capacity.gt(txFee))
    );
  }
}
