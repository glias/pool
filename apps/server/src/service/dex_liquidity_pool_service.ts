import { HashType } from '@ckb-lumos/base';
import { Server } from '@gliaswap/types';
import { Context } from 'koa';

import { Script } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { TxBuilderService } from '.';

export class DexLiquidityPoolService {
  private readonly dexRepository: DexRepository;
  private readonly txBuilderService: TxBuilderService;

  constructor() {
    this.dexRepository = ckbRepository;
    this.txBuilderService = new TxBuilderService();
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
    return await this.txBuilderService.buildGenesisLiquidity(ctx, req);
  }

  // TODO: ensure req token type script exists
  public async buildAddLiquidityOrder(
    ctx: Context,
    req: Server.AddLiquidityRequest,
  ): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildAddLiquidity(ctx, req);
  }

  // TODO: ensure req token type script exists
  public async buildRemoveLiquidityOrder(
    ctx: Context,
    req: Server.RemoveLiquidityRequest,
  ): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildRemoveLiquidity(ctx, req);
  }
}

export const dexLiquidityPoolService = new DexLiquidityPoolService();
