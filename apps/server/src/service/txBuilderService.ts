import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { Context } from 'koa';
import * as lumos from '@ckb-lumos/base';
import * as constants from '@gliaswap/constants';

import { ckbRepository, DexRepository } from '../repository';
import * as utils from '../utils';
import { Cell, Script, Token, RawTransaction, cellConver, Output, TransactionToSign } from '../model';
import { CellInfoSerializationHolderFactory, CellInfoSerializationHolder } from '../model';
import * as config from '../config';

export interface CreateLiquidityPoolRequest {
  tokenA: Token;
  tokenB: Token;
  userLock: Script;
}

export class CreateLiquidityPoolResponse {
  tx: TransactionToSign;
  fee: bigint;
  lpToken: Token;

  constructor(tx: TransactionToSign, fee: bigint, lpToken: Token) {
    this.tx = tx;
    this.fee = fee;
    this.lpToken = lpToken;
  }

  serialize(): Record<string, unknown> {
    return {
      tx: this.tx.serialize(),
      fee: this.fee.toString(),
      lpToken: this.lpToken.serialize(),
    };
  }
}

export interface GenesisLiquidityRequest {
  tokenAAmount: Token;
  tokenBAmount: Token;
  poolId: string;
  userLock: Script;
  tips: Token;
}

export interface AddLiquidityRequest {
  tokenADesiredAmount: Token;
  tokenAMinAmount: Token;
  tokenBDesiredAmount: Token;
  tokenBMinAmount: Token;
  poolId: string;
  userLock: Script;
  tips: Token;
}

export interface RemoveLiquidityRequest {
  lpTokenAmount: Token;
  tokenAMinAmount: Token;
  tokenBMinAmount: Token;
  poolId: string;
  userLock: Script;
  tips: Token;
}

export interface SwapOrderRequest {
  tokenInAmount: Token;
  tokenOutMinAmount: Token;
  userLock: Script;
  tips: Token;
}

export interface CancelOrderRequest {
  txHash: string;
  userLock: Script;
  requestType: CancelRequestType;
}

export class TransactionWithFee {
  tx: TransactionToSign;
  fee: bigint;

  constructor(tx: TransactionToSign, fee: bigint) {
    this.tx = tx;
    this.fee = fee;
  }

  serialize(): Record<string, unknown> {
    return {
      tx: this.tx.serialize(),
      fee: this.fee.toString(),
    };
  }
}

export const enum CancelRequestType {
  Liquidity,
  Swap,
}

export interface CollectedCells {
  inputCells: Cell[];
  inputCapacity: bigint;
  inputToken?: bigint;
}

export interface CellCollector {
  collect(ctx: Context, capacity: bigint, userLock: Script, tokenAmount?: Token): Promise<CollectedCells>;
}

export class TxBuilderService {
  private readonly cellCollector: CellCollector;
  private readonly dexRepository: DexRepository;
  private readonly codec: CellInfoSerializationHolder;

  constructor(collector?: CellCollector, dexRepository?: DexRepository) {
    this.cellCollector = collector ? collector : new TxBuilderCellCollector();
    this.dexRepository = dexRepository ? dexRepository : ckbRepository;
    this.codec = CellInfoSerializationHolderFactory.getInstance();
  }

  public async buildCreateLiquidityPool(
    ctx: Context,
    req: CreateLiquidityPoolRequest,
    txFee = 0n,
  ): Promise<CreateLiquidityPoolResponse> {
    // Collect enough free ckb to generate liquidity pool cells
    // Ensure we always have change output cell to simplify tx fee calculation
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minCapacity = constants.INFO_CAPACITY + constants.MIN_POOL_CAPACITY + minCKBChangeCapacity + txFee;
    const { inputCells, inputCapacity } = await this.cellCollector.collect(ctx, minCapacity, req.userLock);
    if (!inputCells[0].outPoint) {
      ctx.throw(500, 'create pool failed, first input donest have outpoint');
    }

    // Generate info type script
    // FIXME: index should be u64 to_le_bytes
    // const id = utils.blake2b([inputCells[0].outPoint.txHash, '0']);
    // const infoType = new Script(config.INFO_TYPE_CODE_HASH, config.INFO_TYPE_HASH_TYPE, id);

    // For testnet, we use default hardcode id for each token pool
    const reqToken = req.tokenA.typeHash == CKB_TYPE_HASH ? req.tokenB : req.tokenA;
    const id = config.POOL_INFO_TYPE_ARGS[reqToken.info.symbol];
    const infoType = new Script(config.INFO_TYPE_CODE_HASH, config.INFO_TYPE_HASH_TYPE, id);
    const infoTypeHash = infoType.toHash();
    if (infoTypeHash != config.POOL_ID[reqToken.info.symbol]) {
      ctx.throw(400, `created test pool id don't match one in config, ${reqToken.info.symbol} id: ${infoTypeHash}`);
    }

    // Generate info lock script
    const typeHash = infoType.toHash();
    const pairHash = (() => {
      const token = req.tokenA.typeHash == CKB_TYPE_HASH ? req.tokenB : req.tokenA;
      const hashes = ['ckb', token.typeHash];
      return utils.blake2b(hashes);
    })();
    const infoLockArgs = `0x${pairHash.slice(2)}${typeHash.slice(2)}`;
    const infoLock = new Script(config.INFO_LOCK_CODE_HASH, config.INFO_LOCK_HASH_TYPE, infoLockArgs);

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
      capacity: TxBuilderService.hexBigint(constants.INFO_CAPACITY),
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
      capacity: TxBuilderService.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenType,
    };

    // Generate change output cell
    const changeCapacity = inputCapacity - constants.INFO_CAPACITY - constants.MIN_POOL_CAPACITY;
    let changeOutput = {
      capacity: TxBuilderService.hexBigint(changeCapacity),
      lock: req.userLock,
    };

    const outputs: Output[] = [infoOutput, poolOutput, changeOutput];
    const outputsData: string[] = [infoData, poolData, `0x`];

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
    changeOutput.capacity = TxBuilderService.hexBigint(BigInt(changeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(changeOutput);

    return new CreateLiquidityPoolResponse(txToSign, estimatedTxFee, lpToken);
  }

  public async buildGenesisLiquidity(
    ctx: Context,
    req: GenesisLiquidityRequest,
    txFee = 0n,
  ): Promise<TransactionWithFee> {
    const token = req.tokenAAmount.typeHash == CKB_TYPE_HASH ? req.tokenBAmount : req.tokenAAmount;
    const ckb = req.tokenAAmount.typeHash == CKB_TYPE_HASH ? req.tokenAAmount : req.tokenBAmount;

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(req.userLock, token.typeScript);
    const minCapacity =
      ckb.getBalance() + constants.LIQUIDITY_ORDER_CAPACITY + minCKBChangeCapacity + minTokenChangeCapacity + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, token);

    // Generate genesis request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);
      return encoder(req.userLock.toHash(), constants.REQUEST_VERSION, 0n, 0n, req.poolId, tips, tipsSudt);
    })();
    const reqLock = new Script(config.LIQUIDITY_ORDER_LOCK_CODE_HASH, config.LIQUIDITY_ORDER_LOCK_HASH_TYPE, lockArgs);

    // Generate genesis request output cell
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(constants.LIQUIDITY_ORDER_CAPACITY + ckb.getBalance()),
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: token.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputToken - token.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - constants.LIQUIDITY_ORDER_CAPACITY - ckb.getBalance();
    if (collectedCells.inputToken > token.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    let ckbChangeOutput = {
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildAddLiquidity(ctx: Context, req: AddLiquidityRequest, txFee = 0n): Promise<TransactionWithFee> {
    const tokenDesired =
      req.tokenADesiredAmount.typeHash == CKB_TYPE_HASH ? req.tokenBDesiredAmount : req.tokenADesiredAmount;
    const ckbDesired =
      req.tokenADesiredAmount.typeHash == CKB_TYPE_HASH ? req.tokenADesiredAmount : req.tokenBDesiredAmount;

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(req.userLock, tokenDesired.typeScript);
    const minCapacity =
      ckbDesired.getBalance() +
      constants.LIQUIDITY_ORDER_CAPACITY +
      minCKBChangeCapacity +
      minTokenChangeCapacity +
      txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, tokenDesired);

    // Generate add liquidity request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { ckbAmount, tokenAmount } =
        req.tokenAMinAmount.typeHash == CKB_TYPE_HASH
          ? { ckbAmount: req.tokenAMinAmount.getBalance(), tokenAmount: req.tokenBMinAmount.getBalance() }
          : { ckbAmount: req.tokenBMinAmount.getBalance(), tokenAmount: req.tokenAMinAmount.getBalance() };
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);
      const version = constants.REQUEST_VERSION;

      return encoder(req.userLock.toHash(), version, tokenAmount, ckbAmount, req.poolId, tips, tipsSudt);
    })();
    const reqLock = new Script(config.LIQUIDITY_ORDER_LOCK_CODE_HASH, config.LIQUIDITY_ORDER_LOCK_HASH_TYPE, lockArgs);

    // Generate add liquidity request output cell
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(constants.LIQUIDITY_ORDER_CAPACITY + ckbDesired.getBalance()),
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: tokenDesired.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputToken - tokenDesired.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - constants.LIQUIDITY_ORDER_CAPACITY - ckbDesired.getBalance();
    if (collectedCells.inputToken > tokenDesired.getBalance()) {
      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }
    let ckbChangeOutput = {
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildRemoveLiquidity(
    ctx: Context,
    req: RemoveLiquidityRequest,
    txFee = 0n,
  ): Promise<TransactionWithFee> {
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(req.userLock, req.lpTokenAmount.typeScript);
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
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);

      return encoder(req.userLock.toHash(), version, ckbAmount, tokenAmount, req.poolId, tips, tipsSudt);
    })();
    const reqLock = new Script(config.LIQUIDITY_ORDER_LOCK_CODE_HASH, config.LIQUIDITY_ORDER_LOCK_HASH_TYPE, lockArgs);

    // Generate add liquidity request output cell
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(constants.LIQUIDITY_ORDER_CAPACITY),
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
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
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildSwap(ctx: Context, req: SwapOrderRequest, txFee = 0n): Promise<TransactionWithFee> {
    if (req.tokenInAmount.typeHash == CKB_TYPE_HASH) {
      return await this.buildSwapToken(ctx, req, txFee);
    } else {
      return await this.buildSwapCkb(ctx, req, txFee);
    }
  }

  public async buildCancelOrder(ctx: Context, req: CancelOrderRequest): Promise<TransactionWithFee> {
    const requestCell = await this.extractRequest(ctx, req.txHash, req.requestType);
    if (req.requestType == CancelRequestType.Swap) {
      return await this.buildCancelSwapRequest(ctx, requestCell, req.userLock);
    } else {
      return await this.buildCancelLiquidityRequest(ctx, requestCell, req.userLock);
    }
  }

  public static lpTokenTypeScript(infoTypeScriptArgs: string, tokenTypeHash: string): Script {
    const id = infoTypeScriptArgs;
    const infoType = new Script(config.INFO_TYPE_CODE_HASH, config.INFO_TYPE_HASH_TYPE, id);

    // Generate info lock script
    const infoTypeHash = infoType.toHash();
    const pairHash = utils.blake2b(['ckb', tokenTypeHash]);
    const infoLockArgs = `0x${pairHash.slice(2)}${infoTypeHash.slice(2)}`;
    const infoLock = new Script(config.INFO_LOCK_CODE_HASH, config.INFO_LOCK_HASH_TYPE, infoLockArgs);

    // Generate liquidity provider token type script
    return new Script(config.SUDT_TYPE_CODE_HASH, 'type', infoLock.toHash());
  }

  // Sudt => CKB
  private async buildSwapCkb(ctx: Context, req: SwapOrderRequest, txFee = 0n): Promise<TransactionWithFee> {
    // Collect free ckb and free token cells
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(req.userLock, req.tokenInAmount.typeScript);
    const minCapacity = constants.SWAP_SELL_REQ_CAPACITY + minCKBChangeCapacity + minTokenChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, req.tokenInAmount);

    // Generate swap request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getSwapCellSerialization().encodeArgs;
      const minAmountOut = req.tokenOutMinAmount.getBalance();
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);

      return encoder(req.userLock.toHash(), version, minAmountOut, req.tokenOutMinAmount.typeHash, tips, tipsSudt);
    })();
    const reqLock = new Script(config.SWAP_ORDER_LOCK_CODE_HASH, config.SWAP_ORDER_LOCK_HASH_TYPE, lockArgs);

    // Generate swap request output cell
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(constants.SWAP_SELL_REQ_CAPACITY),
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
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
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  // CKB => SUDT
  private async buildSwapToken(ctx: Context, req: SwapOrderRequest, txFee = 0n): Promise<TransactionWithFee> {
    if (req.tokenInAmount.getBalance() + constants.MIN_SUDT_CAPACITY <= constants.SWAP_BUY_REQ_CAPACITY) {
      ctx.throw(400, 'ckb amount plus min sudt capacity is smaller or equal than 146 * 10^8');
    }

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minCapacity = req.tokenInAmount.getBalance() + constants.MIN_SUDT_CAPACITY + minCKBChangeCapacity + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock);

    // Generate swap request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getSwapCellSerialization().encodeArgs;
      const minAmountOut = req.tokenOutMinAmount.getBalance();
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);

      return encoder(req.userLock.toHash(), version, minAmountOut, req.tokenOutMinAmount.typeHash, tips, tipsSudt);
    })();
    const reqLock = new Script(config.SWAP_ORDER_LOCK_CODE_HASH, config.SWAP_ORDER_LOCK_HASH_TYPE, lockArgs);

    // Generate swap request output cell
    const reqCapacity = req.tokenInAmount.getBalance() + constants.MIN_SUDT_CAPACITY;
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(reqCapacity),
      lock: reqLock,
      type: req.tokenInAmount.typeScript,
    };
    const reqData = '0x';

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    const ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
    let ckbChangeOutput = {
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  private async extractRequest(ctx: Context, txHash: string, requestType: CancelRequestType): Promise<Cell> {
    const { transaction } = await this.dexRepository.getTransaction(txHash);
    const requestLockCodeHash =
      requestType == CancelRequestType.Liquidity
        ? config.LIQUIDITY_ORDER_LOCK_CODE_HASH
        : config.SWAP_ORDER_LOCK_CODE_HASH;

    const idx = transaction.outputs.findIndex((output: Output) => output.lock.codeHash == requestLockCodeHash);
    if (idx == -1) {
      ctx.throw(404, `request not found in transaction ${txHash}`);
    }

    const output = transaction.outputs[idx];
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
  }

  private async buildCancelLiquidityRequest(
    ctx: Context,
    requestCell: Cell,
    userLock: Script,
    txFee: bigint = 61n * constants.CKB_DECIMAL,
  ): Promise<TransactionWithFee> {
    const liquidityArgs = (() => {
      const decoder = this.codec.getLiquidityCellSerialization().decodeArgs;
      return decoder(requestCell.cellOutput.lock.args);
    })();
    if (liquidityArgs.userLockHash != userLock.toHash()) {
      ctx.throw(400, 'user lock hash not match');
    }

    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(userLock, requestCell.cellOutput.type);
    const minCapacity = minCKBChangeCapacity + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, userLock);
    const inputCapacity = BigInt(requestCell.cellOutput.capacity) + collectedCells.inputCapacity;

    const outputs: Output[] = [];
    const outputsData: string[] = [];

    const tokenChangeOutput = {
      capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
      lock: userLock,
      type: requestCell.cellOutput.type,
    };
    const tokenChangeData = requestCell.data;
    outputs.push(tokenChangeOutput);
    outputsData.push(tokenChangeData);

    const ckbChangeCapacity = inputCapacity - minTokenChangeCapacity;
    let ckbChangeOutput = {
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
      lock: userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    const inputs = collectedCells.inputCells.concat(requestCell).map((cell) => {
      return cellConver.converToInput(cell);
    });
    const inputCells = collectedCells.inputCells.concat(requestCell);

    const userLockDeps = config.LOCK_DEPS[userLock.codeHash];
    const cellDeps = [config.SUDT_TYPE_DEP, config.LIQUIDITY_ORDER_LOCK_DEP].concat(userLockDeps);
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
      return await this.buildCancelLiquidityRequest(ctx, requestCell, userLock, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  private async buildCancelSwapRequest(
    ctx: Context,
    requestCell: Cell,
    userLock: Script,
    txFee: bigint = 61n * constants.CKB_DECIMAL,
  ): Promise<TransactionWithFee> {
    const swapArgs = (() => {
      const decoder = this.codec.getSwapCellSerialization().decodeArgs;
      return decoder(requestCell.cellOutput.lock.args);
    })();
    if (swapArgs.userLockHash != userLock.toHash()) {
      ctx.throw(400, 'user lock hash not match');
    }

    // Sell sudt, split swap cell into free token cell and free ckb cell
    const minCKBChangeCapacity =
      swapArgs.sudtTypeHash == CKB_TYPE_HASH ? TxBuilderService.minCKBChangeCapacity(userLock) : 0n;
    const minTokenChangeCapacity =
      swapArgs.sudtTypeHash == CKB_TYPE_HASH
        ? TxBuilderService.minTokenChangeCapacity(userLock, requestCell.cellOutput.type)
        : 0n;
    const minCapacity = minCKBChangeCapacity + txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, userLock);
    const inputCapacity = BigInt(requestCell.cellOutput.capacity) + collectedCells.inputCapacity;

    const outputs: Output[] = [];
    const outputsData: string[] = [];

    if (swapArgs.sudtTypeHash == CKB_TYPE_HASH) {
      const tokenChangeOutput = {
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
        lock: userLock,
        type: requestCell.cellOutput.type,
      };
      const tokenChangeData = requestCell.data;
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    const ckbChangeCapacity =
      swapArgs.sudtTypeHash == CKB_TYPE_HASH ? inputCapacity - minTokenChangeCapacity : inputCapacity;
    let ckbChangeOutput = {
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
      lock: userLock,
    };
    outputs.push(ckbChangeOutput);
    outputsData.push('0x');

    const inputs = collectedCells.inputCells.concat(requestCell).map((cell) => {
      return cellConver.converToInput(cell);
    });
    const inputCells = collectedCells.inputCells.concat(requestCell);

    const userLockDeps = config.LOCK_DEPS[userLock.codeHash];
    const cellDeps = [config.SWAP_ORDER_LOCK_DEP].concat(userLockDeps);
    if (swapArgs.sudtTypeHash == CKB_TYPE_HASH) {
      cellDeps.push(config.SUDT_TYPE_DEP);
    }
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  private static hexBigint(n: bigint): string {
    return `0x${n.toString(16)}`;
  }

  private static minCKBChangeCapacity(userLock: Script): bigint {
    return (BigInt(userLock.size()) + 8n) * constants.CKB_DECIMAL; // +8 for capacity bytes
  }

  private static minTokenChangeCapacity(userLock: Script, tokenType: Script): bigint {
    const scriptSize = BigInt(userLock.size() + tokenType.size());
    return (scriptSize + 8n + constants.MIN_SUDT_DATA_SIZE) * constants.CKB_DECIMAL;
  }

  // TODO: refactor
  private static tips(token: Token): { tips: bigint; tipsSudt: bigint } {
    if (token.typeHash == CKB_TYPE_HASH) {
      return {
        tips: BigInt(token.balance),
        tipsSudt: 0n,
      };
    } else {
      return {
        tips: 0n,
        tipsSudt: BigInt(token.balance),
      };
    }
  }
}

class TxBuilderCellCollector implements CellCollector {
  private readonly ckbRepository: DexRepository;
  private readonly codec: CellInfoSerializationHolder;
  private warningMessage = `You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`;

  constructor() {
    this.ckbRepository = ckbRepository;
    this.codec = CellInfoSerializationHolderFactory.getInstance();
  }

  public async collect(ctx: Context, capacity: bigint, userLock: Script, token?: Token): Promise<CollectedCells> {
    const inputCells: Array<Cell> = [];
    let inputTokenAmount = 0n;
    let inputCapacity = 0n;

    if (token && token.getBalance() != 0n) {
      const queryOptions: lumos.QueryOptions = {
        lock: userLock.toLumosScript(),
        type: token.typeScript.toLumosScript(),
      };

      const cells = await this.ckbRepository.collectCells(queryOptions);
      for (const cell of cells) {
        if (inputTokenAmount >= token.getBalance()) {
          break;
        }

        inputTokenAmount = inputTokenAmount + this.codec.getSudtCellSerialization().decodeData(cell.data);
        inputCells.push(cell);
        inputCapacity = inputCapacity + BigInt(cell.cellOutput.capacity);
      }

      if (inputTokenAmount < token.getBalance()) {
        ctx.throw(400, this.warningMessage);
      }
    }

    if (inputCapacity < capacity) {
      const queryOptions: lumos.QueryOptions = {
        lock: userLock.toLumosScript(),
      };
      const cells = await this.ckbRepository.collectCells(queryOptions);
      // Filter non-free ckb cells
      const freeCells = cells.filter((cell) => cell.data === '0x' && !cell.cellOutput.type);
      for (const cell of freeCells) {
        if (inputCapacity >= capacity) {
          break;
        }

        inputCells.push(cell);
        inputCapacity = inputCapacity + BigInt(cell.cellOutput.capacity);
      }
      if (inputCapacity < capacity) {
        ctx.throw(400, this.warningMessage);
      }
    }

    return {
      inputCells,
      inputCapacity,
      inputToken: inputTokenAmount != 0n ? inputTokenAmount : null,
    };
  }
}
