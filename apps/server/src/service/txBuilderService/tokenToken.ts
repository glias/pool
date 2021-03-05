import { createFixedStruct, U8, U128LE, U64LE } from 'easy-byte';
import { Context } from 'koa';
import * as constants from '@gliaswap/constants';

import { ckbRepository, DexRepository } from '../../repository';
import * as utils from '../../utils';
import { Cell, Script, Token, RawTransaction, cellConver, Output, TransactionToSign, PoolInfo } from '../../model';
import * as config from '../../config';

import { CellCollector, TxBuilderCellCollector } from './collector';
import * as rr from './requestResponse';
import * as txBuilderUtils from './utils';
import { TxBuilderService } from '.';

const LIQUIDITY_REQ_TOKEN_X_CAPACITY = 259n;
const LIQUIDITY_REQ_TOKEN_Y_CAPACITY = 219n;
const SWAP_REQ_CAPACITY = 219n;

export class TokenTokenTxBuilderService implements TxBuilderService {
  private readonly cellCollector: CellCollector;
  private readonly dexRepository: DexRepository;
  private readonly codec: TokenTokenRequestCellSerializationHolder;

  constructor(collector?: CellCollector, dexRepository?: DexRepository) {
    this.cellCollector = collector ? collector : new TxBuilderCellCollector();
    this.dexRepository = dexRepository ? dexRepository : ckbRepository;
    this.codec = new TokenTokenRequestCellSerializationHolder();
  }

  public async buildCreateLiquidityPool(
    ctx: Context,
    req: rr.CreateLiquidityPoolRequest,
    txFee = 0n,
  ): Promise<rr.CreateLiquidityPoolResponse> {
    // Collect enough free ckb to generate liquidity pool cells
    // Ensure we always have change output cell to simplify tx fee calculation
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minCapacity = constants.INFO_CAPACITY + constants.MIN_POOL_CAPACITY * 2n + minCKBChangeCapacity + txFee;
    const { inputCells, inputCapacity } = await this.cellCollector.collect(ctx, minCapacity, req.userLock);
    if (!inputCells[0].outPoint) {
      ctx.throw(500, 'create pool failed, first input donest have outpoint');
    }

    // Generate info type script
    const id = utils.blake2b([inputCells[0].outPoint.txHash, '0']);
    const infoType = new Script(config.INFO_TYPE_CODE_HASH, config.INFO_TYPE_HASH_TYPE, id);

    // Generate info lock script
    const typeHash = infoType.toHash();
    const pairHash = utils.blake2b([req.tokenA.typeHash, req.tokenB.typeHash].sort());
    const infoLockArgs = `0x${pairHash.slice(2)}${typeHash.slice(2)}`;
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

    // Generate pool output cells
    const tokens = [req.tokenA.typeHash, req.tokenB.typeHash].sort();

    const tokenXType = tokens[0];
    const poolXData = this.codec.getSudtCellSerialization().encodeData(0n);
    const poolXOutput = {
      capacity: txBuilderUtils.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenXType,
    };

    const tokenYType = tokens[1];
    const poolYData = this.codec.getSudtCellSerialization().encodeData(0n);
    const poolYOutput = {
      capacity: txBuilderUtils.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenYType,
    };

    // Generate change output cell
    const changeCapacity = inputCapacity - constants.INFO_CAPACITY - constants.MIN_POOL_CAPACITY * 2n;
    let changeOutput = {
      capacity: txBuilderUtils.hexBigint(changeCapacity),
      lock: req.userLock,
    };

    const outputs: Output[] = [infoOutput, poolXOutput, poolYOutput, changeOutput];
    const outputsData: string[] = [infoData, poolXData, poolYData, `0x`];

    // Generate transaction
    const inputs = inputCells.map((cell) => {
      return cellConver.converToInput(cell);
    });
    const userLockDeps = config.LOCK_DEPS[req.userLock.codeHash];
    const cellDeps = [config.INFO_TYPE_DEP, config.SUDT_TYPE_DEP].concat(userLockDeps);
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
    const { tokenXAmount, tokenYAmount } =
      req.tokenAAmount.typeHash < req.tokenBAmount.typeHash
        ? { tokenXAmount: req.tokenAAmount, tokenYAmount: req.tokenBAmount }
        : { tokenXAmount: req.tokenBAmount, tokenYAmount: req.tokenAAmount };

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, req.tokenAAmount.typeScript);

    const minCapacity =
      LIQUIDITY_REQ_TOKEN_X_CAPACITY +
      LIQUIDITY_REQ_TOKEN_Y_CAPACITY +
      minCKBChangeCapacity +
      minTokenChangeCapacity * 2n +
      txFee;
    const collectedCells = await this.cellCollector.multiCollect(ctx, minCapacity, req.userLock, [
      tokenXAmount,
      tokenYAmount,
    ]);
    const [collectedTokenXAmount, collectedTokenYAmount] = collectedCells.inputTokens;

    // Generate add liquidity request lock script
    const tokenXLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeMainArgs;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);
      const tipsTokenX = req.tips.typeHash == tokenXAmount.typeHash ? tipsSudt : 0n;
      const tipsTokenY = req.tips.typeHash == tokenYAmount.typeHash ? 0n : tipsSudt;

      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, 0n, 0n, tips, tipsTokenX, tipsTokenY);
    })();
    const reqTokenXLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, tokenXLockArgs);

    const tokenYLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeFellowArgs;
      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, reqTokenXLock.toHash());
    })();
    const reqTokenYLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, tokenYLockArgs);

    // Generate add liquidity request output cells
    const reqTokenXOutput = {
      capacity: txBuilderUtils.hexBigint(LIQUIDITY_REQ_TOKEN_X_CAPACITY),
      lock: reqTokenXLock,
      type: tokenXAmount.typeScript,
    };
    const reqTokenXData = this.codec.getSudtCellSerialization().encodeData(tokenXAmount.getBalance());

    const reqTokenYOutput = {
      capacity: txBuilderUtils.hexBigint(LIQUIDITY_REQ_TOKEN_Y_CAPACITY),
      lock: reqTokenYLock,
      type: tokenYAmount.typeScript,
    };
    const reqTokenYData = this.codec.getSudtCellSerialization().encodeData(tokenYAmount.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqTokenXOutput, reqTokenYOutput];
    const outputsData: string[] = [reqTokenXData, reqTokenYData];

    if (collectedTokenXAmount > tokenXAmount.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenXChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: tokenXAmount.typeScript,
      };

      const encode = this.codec.getSudtCellSerialization().encodeData;
      const tokenXChangeData = encode(collectedTokenXAmount - tokenXAmount.getBalance());

      outputs.push(tokenXChangeOutput);
      outputsData.push(tokenXChangeData);
    }

    if (collectedTokenYAmount > tokenYAmount.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenYChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: tokenYAmount.typeScript,
      };

      const encode = this.codec.getSudtCellSerialization().encodeData;
      const tokenYChangeData = encode(collectedTokenYAmount - tokenYAmount.getBalance());

      outputs.push(tokenYChangeOutput);
      outputsData.push(tokenYChangeData);
    }

    let ckbChangeCapacity =
      collectedCells.inputCapacity - LIQUIDITY_REQ_TOKEN_X_CAPACITY - LIQUIDITY_REQ_TOKEN_Y_CAPACITY;
    if (collectedTokenXAmount > tokenXAmount.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    if (collectedTokenYAmount > tokenYAmount.getBalance()) {
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
    const { tokenXDesired, tokenYDesired } =
      req.tokenADesiredAmount.typeHash < req.tokenBDesiredAmount.typeHash
        ? { tokenXDesired: req.tokenADesiredAmount, tokenYDesired: req.tokenBDesiredAmount }
        : { tokenXDesired: req.tokenBDesiredAmount, tokenYDesired: req.tokenADesiredAmount };

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(
      req.userLock,
      req.tokenADesiredAmount.typeScript,
    );

    const minCapacity =
      LIQUIDITY_REQ_TOKEN_X_CAPACITY +
      LIQUIDITY_REQ_TOKEN_Y_CAPACITY +
      minCKBChangeCapacity +
      minTokenChangeCapacity * 2n +
      txFee;
    const collectedCells = await this.cellCollector.multiCollect(ctx, minCapacity, req.userLock, [
      tokenXDesired,
      tokenYDesired,
    ]);
    const [collectedTokenXAmount, collectedTokenYAmount] = collectedCells.inputTokens;

    // Generate add liquidity request lock script
    const tokenXLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeMainArgs;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);
      const tipsTokenX = req.tips.typeHash == tokenXDesired.typeHash ? tipsSudt : 0n;
      const tipsTokenY = req.tips.typeHash == tokenXDesired.typeHash ? 0n : tipsSudt;
      const { tokenXMin, tokenYMin } =
        req.tokenAMinAmount.typeHash == tokenXDesired.typeHash
          ? { tokenXMin: req.tokenAMinAmount.getBalance(), tokenYMin: req.tokenBMinAmount.getBalance() }
          : { tokenXMin: req.tokenBMinAmount.getBalance(), tokenYMin: req.tokenAMinAmount.getBalance() };

      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, tokenXMin, tokenYMin, tips, tipsTokenX, tipsTokenY);
    })();
    const reqTokenXLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, tokenXLockArgs);

    const tokenYLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeFellowArgs;
      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, reqTokenXLock.toHash());
    })();
    const reqTokenYLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, tokenYLockArgs);

    // Generate add liquidity request output cells
    const reqTokenXOutput = {
      capacity: txBuilderUtils.hexBigint(LIQUIDITY_REQ_TOKEN_X_CAPACITY),
      lock: reqTokenXLock,
      type: tokenXDesired.typeScript,
    };
    const reqTokenXData = this.codec.getSudtCellSerialization().encodeData(tokenXDesired.getBalance());

    const reqTokenYOutput = {
      capacity: txBuilderUtils.hexBigint(LIQUIDITY_REQ_TOKEN_Y_CAPACITY),
      lock: reqTokenYLock,
      type: tokenYDesired.typeScript,
    };
    const reqTokenYData = this.codec.getSudtCellSerialization().encodeData(tokenYDesired.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqTokenXOutput, reqTokenYOutput];
    const outputsData: string[] = [reqTokenXData, reqTokenYData];

    if (collectedTokenXAmount > tokenXDesired.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenXChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: tokenXDesired.typeScript,
      };

      const encode = this.codec.getSudtCellSerialization().encodeData;
      const tokenXChangeData = encode(collectedTokenXAmount - tokenXDesired.getBalance());

      outputs.push(tokenXChangeOutput);
      outputsData.push(tokenXChangeData);
    }

    if (collectedTokenYAmount > tokenYDesired.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenYChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: tokenYDesired.typeScript,
      };

      const encode = this.codec.getSudtCellSerialization().encodeData;
      const tokenYChangeData = encode(collectedTokenYAmount - tokenYDesired.getBalance());

      outputs.push(tokenYChangeOutput);
      outputsData.push(tokenYChangeData);
    }

    let ckbChangeCapacity =
      collectedCells.inputCapacity - LIQUIDITY_REQ_TOKEN_X_CAPACITY - LIQUIDITY_REQ_TOKEN_Y_CAPACITY;
    if (collectedTokenXAmount > tokenXDesired.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    if (collectedTokenYAmount > tokenYDesired.getBalance()) {
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

    // Ensure request cell's capacity is enough to cover two token cells
    const twoTokenCapacity = minTokenChangeCapacity * 2n;
    const reqCapacity =
      LIQUIDITY_REQ_TOKEN_X_CAPACITY >= twoTokenCapacity ? LIQUIDITY_REQ_TOKEN_X_CAPACITY : twoTokenCapacity;
    const minCapacity = reqCapacity + minCKBChangeCapacity + minTokenChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, req.lpTokenAmount);

    // Generate remove liquidity request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeMainArgs;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);
      const [tokenXAmountMin, tokenYAmountMin] =
        req.tokenAMinAmount.typeHash < req.tokenBMinAmount.typeHash
          ? [req.tokenAMinAmount.getBalance(), req.tokenBMinAmount.getBalance()]
          : [req.tokenBMinAmount.getBalance(), req.tokenAMinAmount.getBalance()];
      const version = constants.REQUEST_VERSION;

      return encoder(req.poolId, req.userLock.toHash(), version, tokenXAmountMin, tokenYAmountMin, tips, tipsSudt, 0n);
    })();
    const reqLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, lockArgs);

    // Generate add liquidity request output cell
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(reqCapacity),
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

    let ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
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
    // Collect free ckb and free token cells
    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(req.userLock, req.tokenInAmount.typeScript);

    // The expected swap result is one token cell and one ckb change cell
    const reqResultCapacity = minCKBChangeCapacity + minTokenChangeCapacity;
    const reqCapacity = SWAP_REQ_CAPACITY >= reqResultCapacity ? SWAP_REQ_CAPACITY : reqResultCapacity;
    const minCapacity = reqCapacity + minCKBChangeCapacity + minTokenChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, req.tokenInAmount);

    // Generate swap request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getSwapCellSerialization().encodeArgs;
      const minAmountOut = req.tokenOutMinAmount.getBalance();
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);

      return encoder(req.tokenOutMinAmount.typeHash, req.userLock.toHash(), version, minAmountOut, tips, tipsSudt);
    })();
    const reqLock = new Script(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_HASH_TYPE, lockArgs);

    // Generate swap request output cell
    const reqOutput = {
      capacity: txBuilderUtils.hexBigint(reqCapacity),
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

    let ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
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
      return await this.buildSwap(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildCancelReq(ctx: Context, req: rr.CancelRequest): Promise<rr.TransactionWithFee> {
    const requestLockCodeHash =
      req.requestType == rr.CancelRequestType.Liquidity ? config.LIQUIDITY_LOCK_CODE_HASH : config.SWAP_LOCK_CODE_HASH;

    const requestCells = await txBuilderUtils.extractRequest(ctx, this.dexRepository, req.txHash, requestLockCodeHash);
    if (req.requestType == rr.CancelRequestType.Swap) {
      if (requestCells.length != 1) {
        ctx.throw(500, `more than one swap requests found in tx ${req.txHash}`);
      }

      return await this.buildCancelSwapRequest(ctx, requestCells[0], req.userLock);
    } else {
      if (requestCells.length > 2) {
        ctx.throw(500, `more than two liquidity request cells found in tx ${req.txHash}`);
      }

      return await this.buildCancelLiquidityRequest(ctx, requestCells, req.userLock);
    }
  }

  // Liquidity reqest has two request cells. Assume user lock args is 20 bytes, then
  // they are both bigger than token cells. So we will have 3 outputs cells, 2 token
  // cells, and one free ckb cell.
  private async buildCancelLiquidityRequest(
    ctx: Context,
    reqCells: Cell[],
    userLock: Script,
    txFee: bigint = 61n * constants.CKB_DECIMAL,
  ): Promise<rr.TransactionWithFee> {
    const mainReqCell = reqCells[0];

    const liquidityArgs = (() => {
      const decoder = this.codec.getLiquidityCellSerialization().decodeMainArgs;
      return decoder(mainReqCell.cellOutput.lock.args);
    })();
    if (liquidityArgs.userLockHash != userLock.toHash()) {
      ctx.throw(400, 'user lock hash not match');
    }

    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(userLock, mainReqCell.cellOutput.type);
    const minCapacity = minCKBChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, userLock);
    const reqCapacity = reqCells.map((cell) => BigInt(cell.cellOutput.capacity)).reduce((accu, cur) => accu + cur);
    const inputCapacity = BigInt(reqCapacity) + collectedCells.inputCapacity;

    const outputs: Output[] = [];
    const outputsData: string[] = [];

    let ckbChangeCapacity = inputCapacity;
    for (const cell of reqCells) {
      const tokenChangeData = cell.data;
      const tokenChangeOutput = {
        capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
        lock: userLock,
        type: cell.cellOutput.type,
      };

      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);

      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }

    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    const inputs = collectedCells.inputCells.concat(reqCells).map((cell) => {
      return cellConver.converToInput(cell);
    });
    const inputCells = collectedCells.inputCells.concat(reqCells);

    const userLockDeps = config.LOCK_DEPS[userLock.codeHash];
    const cellDeps = [config.SUDT_TYPE_DEP, config.LIQUIDITY_LOCK_DEP].concat(userLockDeps);
    const witnessArgs =
      userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];
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
    if (ckbChangeCapacity - estimatedTxFee < minCKBChangeCapacity) {
      return await this.buildCancelLiquidityRequest(ctx, reqCells, userLock, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }

  private async buildCancelSwapRequest(
    ctx: Context,
    requestCell: Cell,
    userLock: Script,
    txFee: bigint = 61n * constants.CKB_DECIMAL,
  ): Promise<rr.TransactionWithFee> {
    const swapArgs = (() => {
      const decoder = this.codec.getSwapCellSerialization().decodeArgs;
      return decoder(requestCell.cellOutput.lock.args);
    })();
    if (swapArgs.userLockHash != userLock.toHash()) {
      ctx.throw(400, 'user lock hash not match');
    }

    const minCKBChangeCapacity = txBuilderUtils.minCKBChangeCapacity(userLock);
    const minTokenChangeCapacity = txBuilderUtils.minTokenChangeCapacity(userLock, requestCell.cellOutput.type);
    const minCapacity = minCKBChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, userLock);
    const inputCapacity = BigInt(requestCell.cellOutput.capacity) + collectedCells.inputCapacity;

    const outputs: Output[] = [];
    const outputsData: string[] = [];

    const tokenChangeOutput = {
      capacity: txBuilderUtils.hexBigint(minTokenChangeCapacity),
      lock: userLock,
      type: requestCell.cellOutput.type,
    };
    const tokenChangeData = requestCell.data;
    outputs.push(tokenChangeOutput);
    outputsData.push(tokenChangeData);

    const ckbChangeCapacity = inputCapacity - minTokenChangeCapacity;
    let ckbChangeOutput = {
      capacity: txBuilderUtils.hexBigint(ckbChangeCapacity),
      lock: userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    const inputs = collectedCells.inputCells.concat(requestCell).map((cell) => {
      return cellConver.converToInput(cell);
    });
    const inputCells = collectedCells.inputCells.concat(requestCell);

    const userLockDeps = config.LOCK_DEPS[userLock.codeHash];
    const cellDeps = [config.SWAP_LOCK_DEP, config.SUDT_TYPE_DEP].concat(userLockDeps);
    const witnessArgs =
      userLock.codeHash == config.PW_LOCK_CODE_HASH
        ? [config.PW_WITNESS_ARGS.Secp256k1]
        : [config.SECP256K1_WITNESS_ARGS];
    const witnessLengths = userLock.codeHash == config.PW_LOCK_CODE_HASH ? [config.PW_ECDSA_WITNESS_LEN] : [];

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
      return await this.buildCancelSwapRequest(ctx, requestCell, userLock, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = txBuilderUtils.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new rr.TransactionWithFee(txToSign, estimatedTxFee);
  }
}

class TokenTokenRequestCellSerializationHolder {
  public getInfoCellSerialization(): InfoCellSerialization {
    return new InfoCellSerialization();
  }

  public getSudtCellSerialization(): SudtCellSerialization {
    return new SudtCellSerialization();
  }

  public getLiquidityCellSerialization(): LiquidityCellSerialization {
    return new LiquidityCellSerialization();
  }

  public getSwapCellSerialization(): SwapCellSerialization {
    return new SwapCellSerialization();
  }
}

class SudtCellSerialization {
  encodeData = (sudtAmount: bigint): string => {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    return `0x${data.encode({ sudtAmount }).toString('hex')}`;
  };

  decodeData = (dataHex: string): bigint => {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    const structObj = data.decode(Buffer.from(dataHex.slice(2, dataHex.length), 'hex'));
    return structObj.sudtAmount;
  };
}

interface InfoCellData {
  tokenXReserve: bigint;
  tokenYReserve: bigint;
  totalLiquidity: bigint;
  tokenLPTypeHash: string;
}

class InfoCellSerialization {
  encodeData = (
    tokenXReserve: bigint,
    tokenYReserve: bigint,
    totalLiquidity: bigint,
    tokenLPTypeHash: string,
  ): string => {
    const data = this.getStructDefine();

    return `0x${data
      .encode({
        tokenXReserve,
        tokenYReserve,
        totalLiquidity,
      })
      .toString('hex')}${tokenLPTypeHash.slice(2, 66)}`;
  };

  decodeData = (dataHex: string): InfoCellData => {
    const data = this.getStructDefine();
    const structObj = data.decode(Buffer.from(dataHex.slice(2, 98), 'hex'));

    const infoCellData: InfoCellData = {
      ...structObj,
      tokenLPTypeHash: `0x${dataHex.slice(98, dataHex.length)}`,
    };

    return infoCellData;
  };

  private getStructDefine() {
    return createFixedStruct()
      .field('tokenXReserve', U128LE)
      .field('tokenYReserve', U128LE)
      .field('totalLiquidity', U128LE);
  }
}

interface LiquidityMainCellArgs {
  infoTypeHash: string;
  userLockHash: string;
  version: number;
  tokenXMin: bigint;
  tokenYMin: bigint;
  tipsCkb: bigint;
  tipsTokenX: bigint;
  tipsTokenY: bigint;
}

interface LiquidityFellowCellArgs {
  infoTypeHash: string;
  userLockHash: string;
  version: number;
  mainCellLockHash: string;
}

class LiquidityCellSerialization {
  encodeMainArgs = (
    infoTypeHash: string,
    userLockHash: string,
    version: number,
    tokenXMin: bigint,
    tokenYMin: bigint,
    tipsCkb: bigint,
    tipsTokenX: bigint,
    tipsTokenY: bigint,
  ): string => {
    const tailArgs = this.getTailArgsDefine()
      .encode({
        version,
        tokenXMin,
        tokenYMin,
        tipsCkb,
        tipsTokenX,
        tipsTokenY,
      })
      .toString('hex');

    return `0x${utils.trim0x(infoTypeHash)}${utils.trim0x(userLockHash)}${tailArgs}`;
  };

  decodeMainArgs = (argsHex: string): LiquidityMainCellArgs => {
    const infoTypeHash = argsHex.slice(0, 66);
    const userLockHash = `0x${argsHex.slice(66, 130)}`;
    const tailArgs = this.getTailArgsDefine().decode(Buffer.from(argsHex.slice(130), 'hex'));

    return {
      infoTypeHash,
      userLockHash,
      ...tailArgs,
    };
  };

  encodeFellowArgs = (
    infoTypeHash: string,
    userLockHash: string,
    version: number,
    mainCellLockHash: string,
  ): string => {
    const ver = createFixedStruct().field('version', U8);
    return `0x
      ${utils.trim0x(infoTypeHash)}
      ${utils.trim0x(userLockHash)}
      ${ver.encode({ version }).toString('hex')}
      ${utils.trim0x(mainCellLockHash)}`;
  };

  decodeFellowArgs = (argsHex: string): LiquidityFellowCellArgs => {
    const ver = createFixedStruct().field('version', U8);

    return {
      infoTypeHash: argsHex.slice(0, 66),
      userLockHash: `0x${argsHex.slice(66, 130)}`,
      ...ver.decode(Buffer.from(argsHex.slice(130, 132), 'hex')),
      mainCellLockHash: argsHex.slice(132, 196),
    };
  };

  private getTailArgsDefine() {
    return createFixedStruct()
      .field('version', U8)
      .field('tokenXMin', U128LE)
      .field('tokenYMin', U128LE)
      .field('tipsCkb', U64LE)
      .field('tipsTokenX', U128LE)
      .field('tipsTokenY', U128LE);
  }
}

interface SwapCellArgs {
  tokenTypeHash: string;
  userLockHash: string;
  version: number;
  amountOutMin: bigint;
  tipsCkb: bigint;
  tipsToken: bigint;
}

class SwapCellSerialization {
  encodeArgs = (
    tokenTypeHash: string,
    userLockHash: string,
    version: number,
    amountOutMin: bigint,
    tipsCkb: bigint,
    tipsToken: bigint,
  ): string => {
    const tailArgs = this.getTailArgsDefine()
      .encode({
        version,
        amountOutMin,
        tipsCkb,
        tipsToken,
      })
      .toString('hex');

    return `0x${utils.trim0x(tokenTypeHash)}${utils.trim0x(userLockHash)}${tailArgs}`;
  };

  public decodeArgs(argsHex: string): SwapCellArgs {
    return {
      tokenTypeHash: argsHex.slice(0, 66),
      userLockHash: `0x${argsHex.slice(66, 130)}`,
      ...this.getTailArgsDefine().decode(Buffer.from(argsHex.slice(130), 'hex')),
    };
  }

  private getTailArgsDefine() {
    return createFixedStruct()
      .field('version', U8)
      .field('amountOutMin', U128LE)
      .field('tipsCkb', U64LE)
      .field('tipsToken', U128LE);
  }
}
