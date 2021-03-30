import { CKB_TYPE_HASH } from '@gliaswap/constants';
import * as constants from '@gliaswap/constants';
import { Context } from 'koa';

import * as config from '../../config';
import {
  Script,
  Token,
  RawTransaction,
  cellConver,
  Output,
  TransactionToSign,
  PoolInfo,
  CellInfoSerializationHolderFactory,
  CellInfoSerializationHolder,
} from '../../model';
import * as utils from '../../utils';

import { CellCollector, TxBuilderCellCollector } from './collector';
import * as rr from './requestResponse';
import * as txBuilderUtils from './utils';
import { TxBuilderService } from '.';

export class CkbTokenTxBuilderService implements TxBuilderService {
  private readonly cellCollector: CellCollector;
  private readonly codec: CellInfoSerializationHolder;

  constructor(collector?: CellCollector) {
    this.cellCollector = collector ? collector : new TxBuilderCellCollector();
    this.codec = CellInfoSerializationHolderFactory.getInstance();
  }

  public async buildCreateLiquidityPool(
    ctx: Context,
    req: rr.CreateLiquidityPoolRequest,
    txFee = 0n,
  ): Promise<rr.CreateLiquidityPoolResponse> {
    // Collect enough free ckb to generate liquidity pool cells
    // Ensure we always have change output cell to simplify tx fee calculation
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minCapacity = constants.INFO_CAPACITY + constants.MIN_POOL_CAPACITY + minCKBChangeCapacity + txFee;
    const { inputCells, inputCapacity } = await this.cellCollector.collect(ctx, minCapacity, req.userLock);
    if (!inputCells[0].outPoint) {
      ctx.throw(500, 'create pool failed, first input donest have outpoint');
    }

    // Generate info type script
    const id = utils.blake2b([inputCells[0].outPoint.txHash, '0x0000000000000000']);
    const infoType = new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, id);

    // Generate info lock script
    const typeHash = infoType.toHash();
    const pairHash = (() => {
      const token = req.tokenA.typeHash == CKB_TYPE_HASH ? req.tokenB : req.tokenA;
      const hashes = ['ckb', token.typeHash];
      return utils.blake2b(hashes);
    })();
    const infoLockArgs = `0x${utils.trim0x(pairHash)}${utils.trim0x(typeHash)}`;
    const infoLock = new Script(PoolInfo.LOCK_CODE_HASH, PoolInfo.LOCK_HASH_TYPE, infoLockArgs);

    // Generate liquidity provider token type script
    const lpTokenType = new Script(config.SUDT_TYPE_CODE_HASH, 'type', infoLock.toHash());
    const lpTokenTypeHash = lpTokenType.toHash();
    const lpToken = new Token(lpTokenType.toHash(), lpTokenType);

    // Generate info data
    const infoData = (() => {
      const encoder = this.codec.getInfoCellSerialization().encodeData;
      return encoder(0n, 0n, 0n, lpTokenTypeHash);
    })();

    // Finally, generate info output cell
    const infoOutput = {
      capacity: txBuilderUtils.hexBigint(constants.INFO_CAPACITY),
      lock: infoLock,
      type: infoType,
    };

    // Generate pool output cell
    const tokenType = req.tokenA.typeHash != CKB_TYPE_HASH ? req.tokenA.typeScript : req.tokenB.typeScript;
    const poolData = (() => {
      const encoder = this.codec.getSudtCellSerialization().encodeData;
      return encoder(0n);
    })();
    const poolOutput = {
      capacity: txBuilderUtils.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenType,
    };

    // Generate change output cell
    const changeCapacity = inputCapacity - constants.INFO_CAPACITY - constants.MIN_POOL_CAPACITY;
    let changeOutput = {
      capacity: txBuilderUtils.hexBigint(changeCapacity),
      lock: req.userLock,
    };

    const outputs: Output[] = [infoOutput, poolOutput, changeOutput];
    const outputsData: string[] = [infoData, poolData, `0x`];

    // Generate transaction
    const inputs = inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = [config.INFO_TYPE_DEP, config.SUDT_TYPE_DEP].concat(userLockDeps).concat(config.INFO_LOCK_DEP);
    const witnessArgs =
      req.userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
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
    if (changeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildCreateLiquidityPool(ctx, req, estimatedTxFee);
    }

    changeOutput = txToSign.raw.outputs.pop();
    changeOutput.capacity = txBuilderUtils.hexBigint(BigInt(changeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(changeOutput);

    return new rr.CreateLiquidityPoolResponse(txToSign, estimatedTxFee, lpToken);
  }

  public async buildGenesisLiquidity(
    ctx: Context,
    req: rr.GenesisLiquidityRequest,
    txFee = 0n,
  ): Promise<rr.TransactionWithFee> {
    const token = req.tokenAAmount.typeHash == CKB_TYPE_HASH ? req.tokenBAmount : req.tokenAAmount;
    const ckb = req.tokenAAmount.typeHash == CKB_TYPE_HASH ? req.tokenAAmount : req.tokenBAmount;

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, token.typeScript);
    if (ckb.getBalance() + minTokenChangeCapacity <= constants.LIQUIDITY_ORDER_CAPACITY) {
      ctx.throw(400, 'ckb amount pluse sudt capacity is smaller or equal to liquidity request capacity');
    }

    const minCapacity = ckb.getBalance() + minCKBChangeCapacity + minTokenChangeCapacity * 2n + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, token);

    // Generate genesis request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);
      return encoder(req.userLock.toHash(), constants.REQUEST_VERSION, 0n, 0n, req.poolId, tips, tipsSudt);
    })();
    const reqLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, lockArgs);

    // Generate genesis request output cell
    const reqCapacity = ckb.getBalance() + minTokenChangeCapacity;
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(reqCapacity),
      lock: reqLock,
      type: token.typeScript,
    };
    const reqData = this.codec.getSudtCellSerialization().encodeData(token.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    if (collectedCells.inputToken > token.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: token.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputToken - token.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
    if (collectedCells.inputToken > token.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: req.userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    // Generate transaction
    const inputs = collectedCells.inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = [config.SUDT_TYPE_DEP].concat(userLockDeps);
    const witnessArgs =
      req.userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
    const raw: RawTransaction = {
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      version: '0x0',
    };
    const txToSign = new TransactionToSign(raw, collectedCells.inputCells, witnessArgs, witnessLengths);

    const estimatedTxFee = txToSign.calcFee();
    if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildGenesisLiquidity(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildAddLiquidity(
    ctx: Context,
    req: rr.AddLiquidityRequest,
    txFee = 0n,
  ): Promise<rr.TransactionWithFee> {
    const tokenDesired =
      req.tokenADesiredAmount.typeHash == CKB_TYPE_HASH ? req.tokenBDesiredAmount : req.tokenADesiredAmount;
    const ckbDesired =
      req.tokenADesiredAmount.typeHash == CKB_TYPE_HASH ? req.tokenADesiredAmount : req.tokenBDesiredAmount;

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, tokenDesired.typeScript);
    if (ckbDesired.getBalance() + minTokenChangeCapacity * 2n <= constants.LIQUIDITY_ORDER_CAPACITY) {
      ctx.throw(400, 'ckb amount plus two sudt capacity is smaller or equal than liquidty request capacity');
    }

    const minCapacity = ckbDesired.getBalance() + minCKBChangeCapacity + minTokenChangeCapacity * 3n + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, tokenDesired);

    // Generate add liquidity request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { ckbAmount, tokenAmount } =
        req.tokenAMinAmount.typeHash == CKB_TYPE_HASH
          ? { ckbAmount: req.tokenAMinAmount.getBalance(), tokenAmount: req.tokenBMinAmount.getBalance() }
          : { ckbAmount: req.tokenBMinAmount.getBalance(), tokenAmount: req.tokenAMinAmount.getBalance() };
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);
      const version = constants.REQUEST_VERSION;

      return encoder(req.userLock.toHash(), version, tokenAmount, ckbAmount, req.poolId, tips, tipsSudt);
    })();
    const reqLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, lockArgs);

    // Generate add liquidity request output cell
    // According to design, injected ckb amount is req.cap - lpt.cap - token.cap
    const reqCapacity = ckbDesired.getBalance() + minTokenChangeCapacity * 2n;
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(reqCapacity),
      lock: reqLock,
      type: tokenDesired.typeScript,
    };
    const reqData = this.codec.getSudtCellSerialization().encodeData(tokenDesired.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    if (collectedCells.inputToken > tokenDesired.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: tokenDesired.typeScript,
      };

      const encode = this.codec.getSudtCellSerialization().encodeData;
      const tokenChangeData = encode(collectedCells.inputToken - tokenDesired.getBalance());

      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
    if (collectedCells.inputToken > tokenDesired.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: req.userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    // Generate transaction
    const inputs = collectedCells.inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = [config.SUDT_TYPE_DEP].concat(userLockDeps);
    const witnessArgs =
      req.userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
    const raw: RawTransaction = {
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      version: '0x0',
    };
    const txToSign = new TransactionToSign(raw, collectedCells.inputCells, witnessArgs, witnessLengths);

    const estimatedTxFee = txToSign.calcFee();
    if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildAddLiquidity(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildRemoveLiquidity(
    ctx: Context,
    req: rr.RemoveLiquidityRequest,
    txFee = 0n,
  ): Promise<rr.TransactionWithFee> {
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, req.lpTokenAmount.typeScript);
    const minCapacity = constants.LIQUIDITY_ORDER_CAPACITY + minCKBChangeCapacity + minTokenChangeCapacity + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, req.lpTokenAmount);

    // Generate remove liquidity request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { ckbAmount, tokenAmount } =
        req.tokenAMinAmount.typeHash == CKB_TYPE_HASH
          ? { ckbAmount: req.tokenAMinAmount.getBalance(), tokenAmount: req.tokenBMinAmount.getBalance() }
          : { ckbAmount: req.tokenBMinAmount.getBalance(), tokenAmount: req.tokenAMinAmount.getBalance() };
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);

      return encoder(req.userLock.toHash(), version, tokenAmount, ckbAmount, req.poolId, tips, tipsSudt);
    })();
    const reqLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, lockArgs);

    // Generate add liquidity request output cell
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(constants.LIQUIDITY_ORDER_CAPACITY),
      lock: reqLock,
      type: req.lpTokenAmount.typeScript,
    };
    const reqData = this.codec.getSudtCellSerialization().encodeData(req.lpTokenAmount.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    if (collectedCells.inputToken > req.lpTokenAmount.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: req.lpTokenAmount.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputToken - req.lpTokenAmount.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - constants.LIQUIDITY_ORDER_CAPACITY;
    if (collectedCells.inputToken > req.lpTokenAmount.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: req.userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    // Generate transaction
    const inputs = collectedCells.inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = [config.SUDT_TYPE_DEP].concat(userLockDeps);
    const witnessArgs =
      req.userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
    const raw: RawTransaction = {
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      version: '0x0',
    };
    const txToSign = new TransactionToSign(raw, collectedCells.inputCells, witnessArgs, witnessLengths);

    const estimatedTxFee = txToSign.calcFee();
    if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildRemoveLiquidity(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildSwap(ctx: Context, req: rr.SwapRequest, txFee = 0n): Promise<rr.TransactionWithFee> {
    if (req.tokenInAmount.typeHash == CKB_TYPE_HASH) {
      return await this.buildSwapToken(ctx, req, txFee);
    } else {
      return await this.buildSwapCkb(ctx, req, txFee);
    }
  }

  public buildSwapLock(req: rr.SwapRequest): Script {
    const encoder = this.codec.getSwapCellSerialization().encodeArgs;

    const version = constants.REQUEST_VERSION;
    const minAmountOut = req.tokenOutMinAmount.getBalance();
    const tokenTypeHash = req.tokenOutMinAmount.typeHash;
    const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);

    const args = encoder(req.userLock.toHash(), version, minAmountOut, tokenTypeHash, tips, tipsSudt);
    return new Script(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_HASH_TYPE, args);
  }

  // Sudt => CKB
  private async buildSwapCkb(ctx: Context, req: rr.SwapRequest, txFee = 0n): Promise<rr.TransactionWithFee> {
    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, req.tokenInAmount.typeScript);
    const minCapacity = constants.SWAP_SELL_REQ_CAPACITY + minCKBChangeCapacity + minTokenChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, req.tokenInAmount);

    // Generate swap request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getSwapCellSerialization().encodeArgs;
      const minAmountOut = req.tokenOutMinAmount.getBalance();
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);

      return encoder(req.userLock.toHash(), version, minAmountOut, req.tokenOutMinAmount.typeHash, tips, tipsSudt);
    })();
    const reqLock = new Script(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_HASH_TYPE, lockArgs);

    // Generate swap request output cell
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(constants.SWAP_SELL_REQ_CAPACITY),
      lock: reqLock,
      type: req.tokenInAmount.typeScript,
    };
    const reqData = this.codec.getSudtCellSerialization().encodeData(req.tokenInAmount.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    if (collectedCells.inputToken > req.tokenInAmount.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: req.tokenInAmount.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputToken - req.tokenInAmount.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - constants.SWAP_SELL_REQ_CAPACITY;
    if (collectedCells.inputToken > req.tokenInAmount.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: req.userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    // Generate transaction
    const inputs = collectedCells.inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = [config.SUDT_TYPE_DEP].concat(userLockDeps);
    const witnessArgs =
      req.userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
    const raw: RawTransaction = {
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      version: '0x0',
    };
    const txToSign = new TransactionToSign(raw, collectedCells.inputCells, witnessArgs, witnessLengths);

    const estimatedTxFee = txToSign.calcFee();
    if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildSwapCkb(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }

  // CKB => SUDT
  private async buildSwapToken(ctx: Context, req: rr.SwapRequest, txFee = 0n): Promise<rr.TransactionWithFee> {
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(
      req.userLock,
      req.tokenOutMinAmount.typeScript,
    );
    if (req.tokenInAmount.getBalance() + minTokenChangeCapacity <= constants.SWAP_BUY_REQ_CAPACITY) {
      ctx.throw(400, 'ckb amount plus min sudt capacity is smaller or equal than swap buy request capacity');
    }

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minCapacity = req.tokenInAmount.getBalance() + minTokenChangeCapacity + minCKBChangeCapacity + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock);

    // Generate swap request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getSwapCellSerialization().encodeArgs;
      const minAmountOut = req.tokenOutMinAmount.getBalance();
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);

      return encoder(req.userLock.toHash(), version, minAmountOut, req.tokenOutMinAmount.typeHash, tips, tipsSudt);
    })();
    const reqLock = new Script(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_HASH_TYPE, lockArgs);

    // Generate swap request output cell
    // According to design, ckb amount in should be req capacity minus token capacity
    const reqCapacity = req.tokenInAmount.getBalance() + minTokenChangeCapacity;
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(reqCapacity),
      lock: reqLock,
      type: req.tokenInAmount.typeScript,
    };
    const reqData = '0x';

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    const ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: req.userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    // Generate transaction
    const inputs = collectedCells.inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = userLockDeps;
    const witnessArgs =
      req.userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = req.userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
    const raw: RawTransaction = {
      cellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      version: '0x0',
    };
    const txToSign = new TransactionToSign(raw, collectedCells.inputCells, witnessArgs, witnessLengths);

    const estimatedTxFee = txToSign.calcFee();
    if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildSwapToken(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }
}
