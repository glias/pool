import { Context } from 'koa';

import * as config from '../../config';
import { ckbRepository, DexRepository } from '../../repository';

import * as rr from './requestResponse';
import { TokenTokenTxBuilderService } from './tokenToken';
import { CkbTokenTxBuilderService } from './ckbToken';
import { TxBuilderCellCollector, CellCollector } from './collector';
import { buildCancelReq } from './cancel';

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
}

export class TxBuilderServiceFactory {
  private readonly tokenTokenTxBuilder: TokenTokenTxBuilderService;
  private readonly ckbTokenTxBuilder: CkbTokenTxBuilderService;
  private readonly cellCollector: CellCollector;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.cellCollector = new TxBuilderCellCollector();
    this.dexRepository = ckbRepository;

    this.tokenTokenTxBuilder = new TokenTokenTxBuilderService(this.cellCollector);
    this.ckbTokenTxBuilder = new CkbTokenTxBuilderService(this.cellCollector);
  }

  public tokenToken(): TokenTokenTxBuilderService {
    return this.tokenTokenTxBuilder;
  }

  public ckbToken(): CkbTokenTxBuilderService {
    return this.ckbTokenTxBuilder;
  }

  cancelRequest = async (ctx: Context, req: rr.CancelRequest): Promise<rr.TransactionWithFee> => {
    const lockMap = new Map();
    lockMap.set(config.LIQUIDITY_LOCK_CODE_HASH, config.LIQUIDITY_LOCK_DEP);
    lockMap.set(config.SWAP_LOCK_CODE_HASH, config.SWAP_LOCK_DEP);
    lockMap.set(config.tokenTokenConfig.LIQUIDITY_LOCK_CODE_HASH, config.tokenTokenConfig.LIQUIDITY_LOCK_DEP);
    lockMap.set(config.tokenTokenConfig.SWAP_LOCK_CODE_HASH, config.tokenTokenConfig.SWAP_LOCK_DEP);

    return await buildCancelReq(ctx, req, lockMap, this.dexRepository, this.cellCollector);
  };
}
