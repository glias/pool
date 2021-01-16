import { HashType } from '@ckb-lumos/base';
import { Script } from '../model';
import { ckbRepository, DexRepository } from '../repository';

export class DexLiquidityPoolService {
  private readonly dexRepository: DexRepository;
  constructor() {
    this.dexRepository = ckbRepository;
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
}

export const dexLiquidityPoolService = new DexLiquidityPoolService();
