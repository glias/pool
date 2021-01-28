import { MockRepositoryFactory } from '../../mockRepositoryFactory';
import { DexLiquidityPoolService } from '../../../service/dexLiquidityPoolService';
import { INFO_LOCK_CODE_HASH, INFO_LOCK_HASH_TYPE, POOL_INFO_TYPE_SCRIPT } from '../../../config';
import { mockGliaPoolInfo } from './mockData';

const mockRepository = MockRepositoryFactory.getDexRepositoryInstance();
const service = new DexLiquidityPoolService(mockRepository);

test('serialized encoding and decoding args', async () => {
  const lock = {
    script: {
      code_hash: INFO_LOCK_CODE_HASH,
      hash_type: INFO_LOCK_HASH_TYPE,
      args: '0x',
    },
    argsLen: 'any',
  };
  mockRepository
    .mockCollectCells()
    .resolves([])
    .withArgs({
      lock: lock,
      type: POOL_INFO_TYPE_SCRIPT[0].toLumosScript(),
    })
    .resolves([mockGliaPoolInfo])
    .withArgs({
      lock: lock,
      type: POOL_INFO_TYPE_SCRIPT[1].toLumosScript(),
    })
    .resolves([mockGliaPoolInfo]);

  const result = await service.getLiquidityPools();
  console.log(result);

  expect(result.length).toEqual(2);
  expect(result).toEqual([mockGliaPoolInfo, mockGliaPoolInfo]);
});
