import { Context } from 'koa';

import * as config from '../../config';
import { Script, PoolInfo } from '../../model';
import { ckbRepository, DexRepository } from '../../repository';
import * as utils from '../../utils';

import { buildCancelReq } from './cancel';
import { CkbTokenTxBuilderService } from './ckbToken';
import { TxBuilderCellCollector, CellCollector } from './collector';
import * as rr from './requestResponse';
import { TokenTokenTxBuilderService } from './tokenToken';

export * from './requestResponse';

export interface TxBuilderService {
  buildCreateLiquidityPool(
    ctx: Context,
    req: rr.CreateLiquidityPoolRequest,
    txFee: bigint,
  ): Promise<rr.CreateLiquidityPoolResponse>;

  buildAddLiquidity(ctx: Context, req: rr.AddLiquidityRequest, txFee: bigint): Promise<rr.TransactionWithFee>;

  buildGenesisLiquidity(ctx: Context, req: rr.GenesisLiquidityRequest, txFee: bigint): Promise<rr.TransactionWithFee>;

  buildRemoveLiquidity(ctx: Context, req: rr.RemoveLiquidityRequest, txFee: bigint): Promise<rr.TransactionWithFee>;

  buildSwap(ctx: Context, req: rr.SwapRequest, txFee: bigint): Promise<rr.TransactionWithFee>;

  buildSwapLock(req: rr.SwapRequest): Script;
}

export class CancelRequestTxBuilder {
  private readonly cellCollector: CellCollector;
  private readonly dexRepository: DexRepository;

  constructor(cellCollector: CellCollector, dexRepository: DexRepository) {
    this.cellCollector = cellCollector;
    this.dexRepository = dexRepository;
  }

  build = async (ctx: Context, req: rr.CancelRequest): Promise<rr.TransactionWithFee> => {
    const lockMap = new Map();
    lockMap.set(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_DEP);
    lockMap.set(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_DEP);
    lockMap.set(config.tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH, config.tokenTokenConfig.LIQUIDITY_LOCK_DEP);
    lockMap.set(config.tokenTokenConfig.SWAP_LOCK_CODE_HASH, config.tokenTokenConfig.SWAP_LOCK_DEP);

    return await buildCancelReq(ctx, req, lockMap, this.dexRepository, this.cellCollector);
  };
}

export class TokenLPTypeScriptBuilder {
  public build(poolId: string, tokenTypeHashes: string[]): Script {
    // Generate info lock script
    const infoTypeHash = poolId;
    const pairHash = utils.blake2b(tokenTypeHashes);
    const infoLockArgs = `0x${utils.trim0x(pairHash)}${utils.trim0x(infoTypeHash)}`;
    const infoLock = new Script(PoolInfo.LOCK_CODE_HASH, PoolInfo.LOCK_HASH_TYPE, infoLockArgs);

    // Generate liquidity provider token type script
    return new Script(config.SUDT_TYPE_CODE_HASH, 'type', infoLock.toHash());
  }
}

export class TxBuilderServiceFactory {
  private readonly tokenTokenTxBuilder: TokenTokenTxBuilderService;
  private readonly ckbTokenTxBuilder: CkbTokenTxBuilderService;
  private readonly cancelTxBuilder: CancelRequestTxBuilder;
  private readonly cellCollector: CellCollector;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.cellCollector = new TxBuilderCellCollector();
    this.dexRepository = ckbRepository;

    this.tokenTokenTxBuilder = new TokenTokenTxBuilderService(this.cellCollector);
    this.ckbTokenTxBuilder = new CkbTokenTxBuilderService(this.cellCollector);
    this.cancelTxBuilder = new CancelRequestTxBuilder(this.cellCollector, this.dexRepository);
  }

  public tokenToken(): TokenTokenTxBuilderService {
    return this.tokenTokenTxBuilder;
  }

  public ckbToken(): CkbTokenTxBuilderService {
    return this.ckbTokenTxBuilder;
  }

  public cancel(): CancelRequestTxBuilder {
    return this.cancelTxBuilder;
  }

  public tokenLPTypeScript(): TokenLPTypeScriptBuilder {
    return new TokenLPTypeScriptBuilder();
  }
}
