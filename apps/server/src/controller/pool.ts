import { Context } from 'koa';
import { Builder } from '@lay2/pw-core';
import { Server } from '@gliaswap/types';

import { OrderBuilder } from '../service';

export default class PoolController {
  public static async addLiquidityOrder(ctx: Context): Promise<void> {
    const req = <Server.AddLiquidityRequest>ctx.request.body;
    console.log(req);

    const tx = await OrderBuilder.buildAddLiquidityOrder(req);
    const fee = Builder.calcFee(tx);

    const resp: Server.TransactionWithFee = {
      pwTransaction: tx,
      fee: fee.toString(),
    };

    ctx.status = 200;
    ctx.body = resp;
  }
}
