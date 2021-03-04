import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { Context } from 'koa';
import * as lumos from '@ckb-lumos/base';
import * as constants from '@gliaswap/constants';

import { ckbRepository, DexRepository } from '../../repository';
import * as utils from '../../utils';
import { Cell, Script, Token, RawTransaction, cellConver, Output, TransactionToSign, PoolInfo } from '../../model';
import * as config from '../../config';

const LIQUIDITY_REQ_TOKEN_X_CAPACITY = 259n;
const LIQUIDITY_REQ_TOKEN_Y_CAPACITY = 219n;
const SWAP_REQ_CAPACITY = 219n;

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
  inputTokens?: bigint[];
}

export interface CellCollector {
  collect(ctx: Context, capacity: bigint, userLock: Script, tokens?: Token[]): Promise<CollectedCells>;
}

export class TxBuilderService {
  private readonly cellCollector: CellCollector;
  private readonly dexRepository: DexRepository;
  private readonly codec: CellInfoSerializationHolder;

  constructor(collector?: CellCollector, dexRepository?: DexRepository) {
    this.cellCollector = collector ? collector : new TxBuilderCellCollector();
    this.dexRepository = dexRepository ? dexRepository : ckbRepository;
    this.codec = new CellInfoSerializationHolder();
  }

  public async buildCreateLiquidityPool(
    ctx: Context,
    req: CreateLiquidityPoolRequest,
    txFee = 0n,
  ): Promise<CreateLiquidityPoolResponse> {
    // Collect enough free ckb to generate liquidity pool cells
    // Ensure we always have change output cell to simplify tx fee calculation
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
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
      capacity: TxBuilderService.hexBigint(constants.INFO_CAPACITY),
      lock: infoLock,
      type: infoType,
    };

    // Generate pool output cells
    const tokens = [req.tokenA.typeHash, req.tokenB.typeHash].sort();

    const tokenXType = tokens[0];
    const poolXData = this.codec.getSudtCellSerialization().encodeData(0n);
    const poolXOutput = {
      capacity: TxBuilderService.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenXType,
    };

    const tokenYType = tokens[1];
    const poolYData = this.codec.getSudtCellSerialization().encodeData(0n);
    const poolYOutput = {
      capacity: TxBuilderService.hexBigint(constants.MIN_POOL_CAPACITY),
      lock: infoLock,
      type: tokenYType,
    };

    // Generate change output cell
    const changeCapacity = inputCapacity - constants.INFO_CAPACITY - constants.MIN_POOL_CAPACITY * 2n;
    let changeOutput = {
      capacity: TxBuilderService.hexBigint(changeCapacity),
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
    changeOutput.capacity = TxBuilderService.hexBigint(BigInt(changeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(changeOutput);

    return new CreateLiquidityPoolResponse(txToSign, estimatedTxFee, lpToken);
  }

  public async buildAddLiquidity(ctx: Context, req: AddLiquidityRequest, txFee = 0n): Promise<TransactionWithFee> {
    const { tokenXDesired, tokenYDesired } =
      req.tokenADesiredAmount.typeHash < req.tokenBDesiredAmount.typeHash
        ? { tokenXDesired: req.tokenADesiredAmount, tokenYDesired: req.tokenBDesiredAmount }
        : { tokenXDesired: req.tokenBDesiredAmount, tokenYDesired: req.tokenADesiredAmount };

    // Collect free ckb and free token cells
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(
      req.userLock,
      req.tokenADesiredAmount.typeScript,
    );

    const minCapacity =
      LIQUIDITY_REQ_TOKEN_X_CAPACITY +
      LIQUIDITY_REQ_TOKEN_Y_CAPACITY +
      minCKBChangeCapacity +
      minTokenChangeCapacity * 2n +
      txFee;
    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, [
      tokenXDesired,
      tokenYDesired,
    ]);
    const [collectedTokenXAmount, collectedTokenYAmount] = collectedCells.inputTokens;

    // Generate add liquidity request lock script
    const tokenXLockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);
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
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const version = constants.REQUEST_VERSION;
      return encoder(req.poolId, req.userLock.toHash(), version, reqTokenXLock.toHash());
    })();
    const reqTokenYLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, tokenYLockArgs);

    // Generate add liquidity request output cells
    const reqTokenXOutput = {
      capacity: TxBuilderService.hexBigint(LIQUIDITY_REQ_TOKEN_X_CAPACITY),
      lock: reqTokenXLock,
      type: tokenXDesired.typeScript,
    };
    const reqTokenXData = this.codec.getSudtCellSerialization().encodeData(tokenXDesired.getBalance());

    const reqTokenYOutput = {
      capacity: TxBuilderService.hexBigint(LIQUIDITY_REQ_TOKEN_Y_CAPACITY),
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
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

    // Ensure request cell's capacity is enough to cover two token cells
    const twoTokenCapacity = minTokenChangeCapacity * 2n;
    const reqCapacity =
      LIQUIDITY_REQ_TOKEN_X_CAPACITY >= twoTokenCapacity ? LIQUIDITY_REQ_TOKEN_X_CAPACITY : twoTokenCapacity;
    const minCapacity = reqCapacity + minCKBChangeCapacity + minTokenChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, [req.lpTokenAmount]);

    // Generate remove liquidity request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getLiquidityCellSerialization().encodeArgs;
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);
      const [tokenXAmount, tokenYAmount] =
        req.tokenAMinAmount.typeHash < req.tokenBMinAmount.typeHash
          ? [req.tokenAMinAmount, req.tokenBMinAmount]
          : [req.tokenBMinAmount, req.tokenAMinAmount];
      const version = constants.REQUEST_VERSION;

      return encoder(req.userLock.toHash(), version, tokenXAmount, tokenYAmount, req.poolId, tips, tipsSudt, 0n);
    })();
    const reqLock = new Script(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_HASH_TYPE, lockArgs);

    // Generate add liquidity request output cell
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(reqCapacity),
      lock: reqLock,
      type: req.lpTokenAmount.typeScript,
    };
    const reqData = this.codec.getSudtCellSerialization().encodeData(req.lpTokenAmount.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    if (collectedCells.inputTokens[0] > req.lpTokenAmount.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenChangeOutput = {
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: req.lpTokenAmount.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputTokens[0] - req.lpTokenAmount.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
    if (collectedCells.inputTokens[0] > req.lpTokenAmount.getBalance()) {
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
    // Collect free ckb and free token cells
    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(req.userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(req.userLock, req.tokenInAmount.typeScript);

    // The expected swap result is one token cell and one ckb change cell
    const reqResultCapacity = minCKBChangeCapacity + minTokenChangeCapacity;
    const reqCapacity = SWAP_REQ_CAPACITY >= reqResultCapacity ? SWAP_REQ_CAPACITY : reqResultCapacity;
    const minCapacity = reqCapacity + minCKBChangeCapacity + minTokenChangeCapacity + txFee;

    const collectedCells = await this.cellCollector.collect(ctx, minCapacity, req.userLock, [req.tokenInAmount]);

    // Generate swap request lock script
    const lockArgs = (() => {
      const encoder = this.codec.getSwapCellSerialization().encodeArgs;
      const minAmountOut = req.tokenOutMinAmount.getBalance();
      const version = constants.REQUEST_VERSION;
      const { tips, tipsSudt } = TxBuilderService.tips(req.tips);

      return encoder(req.tokenOutMinAmount.typeHash, req.userLock.toHash(), version, minAmountOut, tips, tipsSudt);
    })();
    const reqLock = new Script(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_HASH_TYPE, lockArgs);

    // Generate swap request output cell
    const reqOutput = {
      capacity: TxBuilderService.hexBigint(reqCapacity),
      lock: reqLock,
      type: req.tokenInAmount.typeScript,
    };
    const reqData = this.codec.getSudtCellSerialization().encodeData(req.tokenInAmount.getBalance());

    // Generate outputs and change cells
    const outputs: Output[] = [reqOutput];
    const outputsData: string[] = [reqData];

    if (collectedCells.inputTokens[0] > req.tokenInAmount.getBalance()) {
      // We have free token change cell and free ckb change cell
      const tokenChangeOutput = {
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
        lock: req.userLock,
        type: req.tokenInAmount.typeScript,
      };
      const tokenChangeData = this.codec
        .getSudtCellSerialization()
        .encodeData(collectedCells.inputTokens[0] - req.tokenInAmount.getBalance());
      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);
    }

    let ckbChangeCapacity = collectedCells.inputCapacity - reqCapacity;
    if (collectedCells.inputTokens[0] > req.tokenInAmount.getBalance()) {
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
      return await this.buildSwap(ctx, req, estimatedTxFee);
    }

    ckbChangeOutput = txToSign.raw.outputs.pop();
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  public async buildCancelReq(ctx: Context, req: CancelOrderRequest): Promise<TransactionWithFee> {
    const requestCells = await this.extractRequest(ctx, req.txHash, req.requestType);
    if (req.requestType == CancelRequestType.Swap) {
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
  ): Promise<TransactionWithFee> {
    const mainReqCell = reqCells[0];

    const liquidityArgs = (() => {
      const decoder = this.codec.getLiquidityCellSerialization().decodeArgs;
      return decoder(mainReqCell.cellOutput.lock.args);
    })();
    if (liquidityArgs.userLockHash != userLock.toHash()) {
      ctx.throw(400, 'user lock hash not match');
    }

    const minCKBChangeCapacity = TxBuilderService.minCKBChangeCapacity(userLock);
    const minTokenChangeCapacity = TxBuilderService.minTokenChangeCapacity(userLock, mainReqCell.cellOutput.type);
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
        capacity: TxBuilderService.hexBigint(minTokenChangeCapacity),
        lock: userLock,
        type: cell.cellOutput.type,
      };

      outputs.push(tokenChangeOutput);
      outputsData.push(tokenChangeData);

      ckbChangeCapacity = ckbChangeCapacity - minTokenChangeCapacity;
    }

    let ckbChangeOutput = {
      capacity: TxBuilderService.hexBigint(ckbChangeCapacity),
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
    ckbChangeOutput.capacity = TxBuilderService.hexBigint(BigInt(ckbChangeOutput.capacity) - estimatedTxFee);
    txToSign.raw.outputs.push(ckbChangeOutput);

    return new TransactionWithFee(txToSign, estimatedTxFee);
  }

  private async extractRequest(ctx: Context, txHash: string, requestType: CancelRequestType): Promise<Cell[]> {
    const { transaction } = await this.dexRepository.getTransaction(txHash);
    const requestLockCodeHash =
      requestType == CancelRequestType.Liquidity ? config.LIQUIDITY_LOCK_CODE_HASH : config.SWAP_LOCK_CODE_HASH;

    const outputCells = transaction.outputs.map((output: Output, idx: number) => {
      if (output.lock.codeHash != requestLockCodeHash) {
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

    const cells = outputCells.filter((cell) => cell != undefined);
    if (cells.length == 0) {
      ctx.throw(404, `request not found in transaction ${txHash}`);
    }

    return cells;
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
    this.codec = new CellInfoSerializationHolder();
  }

  public async collect(ctx: Context, capacity: bigint, userLock: Script, tokens?: Token[]): Promise<CollectedCells> {
    const inputCells: Array<Cell> = [];
    const inputTokens = [];
    let inputCapacity = 0n;

    if (tokens) {
      for (const token of tokens) {
        if (token.getBalance() == 0n) {
          inputTokens.push(0n);
          continue;
        }

        let collectedAmount = 0n;
        const queryOptions: lumos.QueryOptions = {
          lock: userLock.toLumosScript(),
          type: token.typeScript.toLumosScript(),
        };

        const cells = await this.ckbRepository.collectCells(queryOptions);
        for (const cell of cells) {
          if (collectedAmount >= token.getBalance()) {
            break;
          }

          collectedAmount = collectedAmount + this.codec.getSudtCellSerialization().decodeData(cell.data);
          inputCells.push(cell);
          inputCapacity = inputCapacity + BigInt(cell.cellOutput.capacity);
        }

        if (collectedAmount < token.getBalance()) {
          ctx.throw(400, this.warningMessage);
        }
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
      inputTokens,
    };
  }
}

class CellInfoSerializationHolder {
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
  public encodeData(amount: bigint): string {
    console.log(amount);
    throw Error('unimplement');
  }

  public decodeData(data: string): bigint {
    console.log(data);
    throw Error('unimplement');
  }
}

class InfoCellSerialization {
  public encodeData(...args): string {
    console.log(args);
    throw Error('unimplement');
  }
}

class LiquidityCellSerialization {
  public encodeArgs(...args): string {
    console.log(args);
    throw Error('unimplement');
  }

  public decodeArgs(...args): { userLockHash } {
    console.log(args);
    throw Error('unimplement');
  }
}

class SwapCellSerialization {
  public encodeArgs(...args): string {
    console.log(args);
    throw Error('unimplement');
  }

  public decodeArgs(...args): { userLockHash } {
    console.log(args);
    throw Error('unimplement');
  }
}
