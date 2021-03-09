import { Context } from 'koa';
import * as constants from '@gliaswap/constants';

import * as utils from '../../utils';
import { Script, Token, RawTransaction, cellConver, Output, TransactionToSign } from '../../model';
import * as config from '../../config';
import { tokenTokenConfig } from '../../config';

import * as serde from './serialization';
import { CellCollector, TxBuilderCellCollector } from './collector';
import * as rr from './requestResponse';
import * as txBuilderUtils from './utils';
import { TxBuilderService } from '.';

const LIQUIDITY_REQ_TOKEN_X_CAPACITY = 259n;
const LIQUIDITY_REQ_TOKEN_Y_CAPACITY = 219n;
const SWAP_REQ_CAPACITY = 219n;

export class TokenTokenTxBuilderService implements TxBuilderService {
  private readonly cellCollector: CellCollector;
  private readonly codec: serde.TokenTokenRequestCellSerializationHolder;

  constructor(collector?: CellCollector) {
    this.cellCollector = collector ? collector : new TxBuilderCellCollector();
    this.codec = new serde.TokenTokenRequestCellSerializationHolder();
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
    const infoType = new Script(tokenTokenConfig.INFO_TYPE_CODE_HASH, tokenTokenConfig.INFO_TYPE_HASH_TYPE, id);

    // Generate info lock script
    const typeHash = infoType.toHash();
    const pairHash = utils.blake2b([req.tokenA.typeHash, req.tokenB.typeHash].sort());
    const infoLockArgs = `0x${pairHash.slice(2)}${typeHash.slice(2)}`;
    const infoLock = new Script(
      tokenTokenConfig.INFO_LOCK_CODE_HASH,
      tokenTokenConfig.INFO_LOCK_HASH_TYPE,
      infoLockArgs,
    );

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
    const [tokenXTypeScript, tokenYTypeScript] =
      req.tokenA.typeHash < req.tokenB.typeHash
        ? [req.tokenA.typeScript, req.tokenB.typeScript]
        : [req.tokenB.typeScript, req.tokenA.typeScript];

    const poolXData = this.codec.getSudtCellSerialization().encodeData(0n);
    const poolXOutput = {
      capacity: txBuilderUtils.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenXTypeScript,
    };

    const poolYData = this.codec.getSudtCellSerialization().encodeData(0n);
    const poolYOutput = {
      capacity: txBuilderUtils.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenYTypeScript,
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
    const cellDeps = [tokenTokenConfig.INFO_TYPE_DEP, config.SUDT_TYPE_DEP].concat(userLockDeps);
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
    const reqTokenXLock = new Script(
      tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH,
      tokenTokenConfig.LIQUIDITY_LOCK_HASH_TYPE,
      tokenXLockArgs,
    );

    const tokenYLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeFellowArgs;
      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, reqTokenXLock.toHash());
    })();
    const reqTokenYLock = new Script(
      tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH,
      tokenTokenConfig.LIQUIDITY_LOCK_HASH_TYPE,
      tokenYLockArgs,
    );

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
    const reqTokenXLock = new Script(
      tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH,
      tokenTokenConfig.LIQUIDITY_LOCK_HASH_TYPE,
      tokenXLockArgs,
    );

    const tokenYLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeFellowArgs;
      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, reqTokenXLock.toHash());
    })();
    const reqTokenYLock = new Script(
      tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH,
      tokenTokenConfig.LIQUIDITY_LOCK_HASH_TYPE,
      tokenYLockArgs,
    );

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
    const reqLock = new Script(
      tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH,
      tokenTokenConfig.LIQUIDITY_LOCK_HASH_TYPE,
      lockArgs,
    );

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
    const reqLock = new Script(tokenTokenConfig.SWAP_LOCK_CODE_HASH, tokenTokenConfig.SWAP_LOCK_HASH_TYPE, lockArgs);

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

  public buildSwapLock(req: rr.SwapRequest): Script {
    const encoder = this.codec.getSwapCellSerialization().encodeArgs;
    const minAmountOut = req.tokenOutMinAmount.getBalance();
    const version = constants.REQUEST_VERSION;
    const { tips, tipsSudt } = txBuilderUtils.tips(req.tips);

    const args = encoder(req.tokenOutMinAmount.typeHash, req.userLock.toHash(), version, minAmountOut, tips, tipsSudt);
    return new Script(tokenTokenConfig.SWAP_LOCK_CODE_HASH, tokenTokenConfig.SWAP_LOCK_HASH_TYPE, args);
  }
}
