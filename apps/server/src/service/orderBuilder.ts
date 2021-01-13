import { API } from '@gliaswap/types';
import { Transaction, RawTransaction, Builder } from '@lay2/pw-core';

import { CellCollector } from './cellCollector';

export class OrderBuilder {
  public static async buildAddLiquidityOrder(req: API.AddLiquidityRequest): Promise<Transaction> {
    // FIXME: outputs
    const outputs = [];
    const inputs = await CellCollector.collect(req.tokenADesiredAmount);
    inputs.concat(await CellCollector.collect(req.tokenBDesiredAmount));

    return new Transaction(new RawTransaction(inputs, outputs), [Builder.WITNESS_ARGS.Secp256k1]);
  }
}
