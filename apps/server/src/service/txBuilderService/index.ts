import { Context } from 'koa';

import * as rr from './requestResponse';
import { TokenTokenTxBuilderService } from './tokenToken';
import { CkbTokenTxBuilderService } from './ckbToken';

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

  buildCancelReq(ctx: Context, req: rr.CancelRequest): Promise<rr.TransactionWithFee>;
}

export class TxBuilderServiceFactory {
  private readonly tokenTokenTxBuilder: TokenTokenTxBuilderService;
  private readonly ckbTokenTxBuilder: CkbTokenTxBuilderService;

  constructor() {
    this.tokenTokenTxBuilder = new TokenTokenTxBuilderService();
    this.ckbTokenTxBuilder = new CkbTokenTxBuilderService();
  }

  public tokenToken(): TokenTokenTxBuilderService {
    return this.tokenTokenTxBuilder;
  }

  public ckbToken(): CkbTokenTxBuilderService {
    return this.ckbTokenTxBuilder;
  }
}
