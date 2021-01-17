import { Server } from '@gliaswap/types';
import { Context } from 'koa';

import { TxBuilderService } from '.';

export class DexSwapService {
  private readonly txBuilderService: TxBuilderService;

  constructor() {
    this.txBuilderService = new TxBuilderService();
  }

  public async buildCancelOrderTx(ctx: Context, req: Server.CancelOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildCancelOrder(ctx, req);
  }
}

export const dexSwapService = new DexSwapService();
