import { Context } from 'koa';
import { Server } from '@gliaswap/types';

import { OrderBuilder, CellCollector } from '../service';

export default class PoolController {
  public static async addLiquidityOrder(ctx: Context): Promise<void> {
    const req = <Server.AddLiquidityRequest>ctx.request.body;
    console.log(req);

    const orderBuilder = new OrderBuilder(new CellCollector());
    const tx = await orderBuilder.buildAddLiquidityOrder(req);
    const txWithFee = await orderBuilder.completeTxWithFee(tx);

    ctx.status = 200;
    ctx.body = txWithFee;
  }
}
