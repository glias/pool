import { HashType } from '@ckb-lumos/base';
import { Server } from '@gliaswap/types';
import { Context } from 'koa';

import { Script } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { OrderBuilderService } from '.';

export class DexLiquidityPoolService {
  private readonly dexRepository: DexRepository;
  private readonly orderBuilderService: OrderBuilderService;

  constructor() {
    this.dexRepository = ckbRepository;
    this.orderBuilderService = new OrderBuilderService();
  }

  public async getLiquidityPools(lock: Script, limit: number, skip: number): Promise<void> {
    const result = await this.dexRepository.collectTransactions({
      lock: {
        code_hash: lock.codeHash,
        hash_type: <HashType>lock.hashType,
        args: lock.args,
      },
    });
    console.log(result);
    console.log(limit);
    console.log(skip);
  }

  // TODO: ensure req token type script exists
  public async buildGenesisLiquidityOrder(
    ctx: Context,
    req: Server.GenesisLiquidityRequest,
  ): Promise<Server.TransactionWithFee> {
    return await this.orderBuilderService.buildGenesisLiquidity(ctx, req);
  }

  // TODO: ensure req token type script exists
  public async buildAddLiquidityOrder(
    ctx: Context,
    req: Server.AddLiquidityRequest,
  ): Promise<Server.TransactionWithFee> {
    return await this.orderBuilderService.buildAddLiquidity(ctx, req);
  }

  // TODO: ensure req token type script exists
  public async buildRemoveLiquidityOrder(
    ctx: Context,
    req: Server.RemoveLiquidityRequest,
  ): Promise<Server.TransactionWithFee> {
    return await this.orderBuilderService.buildRemoveLiquidity(ctx, req);
  }
}

export const dexLiquidityPoolService = new DexLiquidityPoolService();
