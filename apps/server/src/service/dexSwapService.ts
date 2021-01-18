import { Server } from '@gliaswap/types';
import { Context } from 'koa';

import { TxBuilderService, CancelOrderType } from '.';

export class DexSwapService {
  private readonly txBuilderService: TxBuilderService;

  constructor() {
    this.txBuilderService = new TxBuilderService();
  }

  public async buildSwapOrderTx(ctx: Context, req: Server.SwapOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildSwap(ctx, req);
  }

  public async buildCancelOrderTx(ctx: Context, req: Server.CancelOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildCancelOrder(ctx, req, CancelOrderType.Swap);
  }

  async orders(ctx: Context, req: Server.OrdersRequest): Promise<[]> {
    const { lock, limit, skip } = req;
    console.log(lock);
    console.log(limit);
    console.log(skip);

    return [];
  }
}

export const dexSwapService = new DexSwapService();
