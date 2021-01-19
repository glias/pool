import { Server } from '@gliaswap/types';
import { Context } from 'koa';
import { TxBuilderService, CancelOrderType } from '.';
import { Script, TokenTokenHolderFactory } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_CODE_TYPE_HASH } from '../config';
import { HashType, QueryOptions } from '@ckb-lumos/base';
import { DexOrderChainFactory } from '../model/orders/dexOrderChainFactory';
import * as pw from '@lay2/pw-core';

export class DexSwapService {
  private readonly txBuilderService: TxBuilderService;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.txBuilderService = new TxBuilderService();
    this.dexRepository = ckbRepository;
  }

  public async buildSwapOrderTx(ctx: Context, req: Server.SwapOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildSwap(ctx, req);
  }

  public async buildCancelOrderTx(ctx: Context, req: Server.CancelOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildCancelOrder(ctx, req, CancelOrderType.Swap);
  }

  async orders(lock: Script, limit: number, skip: number): Promise<[]> {
    const types = TokenTokenHolderFactory.getInstance().getTypeScripts();
    const orderLock: Script = new Script(SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_CODE_TYPE_HASH, lock.toHash());

    for (let i = 0; i < types.length; i++) {
      await this.getNormalOrders(orderLock, types[i]);
    }

    const forceBridgeTxs = await this.dexRepository.getForceBridgeHistory(lock, false);
    console.log(forceBridgeTxs);

    return [];
  }
  private async getNormalOrders(orderLock: Script, type: Script): Promise<[]> {
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: type.toLumosScript(),
      order: 'desc',
    };
    const txs = await this.dexRepository.collectTransactions(queryOptions);

    const factory = new DexOrderChainFactory();
    const orders = factory.getOrderChains(orderLock, type, txs);

    return [];
  }
}

export const dexSwapService = new DexSwapService();
