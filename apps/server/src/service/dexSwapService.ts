import { Server } from '@gliaswap/types';
import { Context } from 'koa';
import { TxBuilderService, CancelOrderType } from '.';
import { BridgeInfoMatchChain, BridgeInfoMatchChainFactory, Script, TokenTokenHolderFactory } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_CODE_TYPE_HASH } from '../config';
import { QueryOptions } from '@ckb-lumos/base';
import { DexOrderChainFactory } from '../model/orders/dexOrderChainFactory';
import { DexOrderChain, OrderHistory } from '../model/orders/dexOrderChain';

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

  async orders(lock: Script, _limit: number, _skip: number): Promise<OrderHistory[]> {
    const types = TokenTokenHolderFactory.getInstance().getTypeScripts();
    const orderLock: Script = new Script(SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_CODE_TYPE_HASH, lock.toHash());
    const bridgeInfoMatch = await this.getBridgeInfoMatch(lock);

    const orders: DexOrderChain[] = [];
    for (let i = 0; i < types.length; i++) {
      const txs = await this.getOrders(orderLock, types[i], bridgeInfoMatch);
      txs.forEach((x) => orders.push(x));
    }

    return orders.map((x) => x.getOrderHistory());
  }

  private async getBridgeInfoMatch(lock: Script): Promise<BridgeInfoMatchChain> {
    const pureCrossTxs = await this.dexRepository.getForceBridgeHistory(lock, true);
    const crossChainOrderTxs = await this.dexRepository.getForceBridgeHistory(lock, false);
    return BridgeInfoMatchChainFactory.getInstance(pureCrossTxs, crossChainOrderTxs);
  }

  private async getOrders(
    orderLock: Script,
    type: Script,
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): Promise<DexOrderChain[]> {
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: type.toLumosScript(),
      order: 'desc',
    };
    const txs = await this.dexRepository.collectTransactions(queryOptions);

    // const mock = MockRepositoryFactory.getDexRepositoryInstance();
    // mock
    //   .mockCollectTransactions()
    //   .resolves(mockDev)
    //   .withArgs({
    //     lock: {
    //       script: orderLock.toLumosScript(),
    //       argsLen: 'any',
    //     },
    //     type: {
    //       codeHash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
    //       hashType: 'type',
    //       args: '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
    //     },
    //     order: 'desc',
    //   });
    // const txs = await mock.collectTransactions(queryOptions);

    const factory = new DexOrderChainFactory();
    const orders = factory.getOrderChains(orderLock, type, txs, bridgeInfoMatch);

    return orders;
  }
}

export const dexSwapService = new DexSwapService();
