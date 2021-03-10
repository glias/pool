import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import { PoolInfo } from '../../../model';
import { DexLiquidityPoolService } from '../../../service/dexLiquidityPoolService';
import { MockRepositoryFactory } from '../../mockRepositoryFactory';

import { mockGliaPoolInfo } from './mockData';

sinonStubPromise(sinon);

describe('/v1/liquidity-pool', () => {
  const mockRepository = MockRepositoryFactory.getDexRepositoryInstance();
  const service = new DexLiquidityPoolService(mockRepository);
  const mock = mockRepository.mockCollectCells();
  beforeEach(() => {
    const lock = {
      script: {
        code_hash: PoolInfo.LOCK_CODE_HASH,
        hash_type: PoolInfo.LOCK_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };

    mock
      .resolves([])
      .withArgs({
        lock: lock,
        type: PoolInfo.TYPE_SCRIPTS['GLIA'].toLumosScript(),
      })
      .resolves([mockGliaPoolInfo])
      .withArgs({
        lock: lock,
        type: PoolInfo.TYPE_SCRIPTS['ckETH'].toLumosScript(),
      })
      .resolves([mockGliaPoolInfo]);
  });

  afterEach(function () {
    mock.restore();
  });

  it('get /v1/liquidity-pool', async () => {
    const result = await service.getLiquidityPools();

    expect(result.length).toEqual(2);
    expect(result).toEqual([
      service.toPoolInfo(mockGliaPoolInfo, PoolInfo.TYPE_SCRIPTS['GLIA']),
      service.toPoolInfo(mockGliaPoolInfo, PoolInfo.TYPE_SCRIPTS['ckETH']),
    ]);
  });
});

describe('/v1/liquidity-pool/pool-id', () => {
  const mockRepository = MockRepositoryFactory.getDexRepositoryInstance();
  const service = new DexLiquidityPoolService(mockRepository);
  const mock = mockRepository.mockCollectCells();
  beforeEach(async () => {
    const lock = {
      script: {
        code_hash: PoolInfo.LOCK_CODE_HASH,
        hash_type: PoolInfo.LOCK_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };

    mock
      .resolves([])
      .withArgs({
        lock: lock,
        type: PoolInfo.TYPE_SCRIPTS['GLIA'].toLumosScript(),
      })
      .resolves([mockGliaPoolInfo])
      .withArgs({
        lock: lock,
        type: PoolInfo.TYPE_SCRIPTS['ckETH'].toLumosScript(),
      })
      .resolves([mockGliaPoolInfo]);
  });

  afterEach(async function () {
    mock.restore();
  });

  it('get /v1/liquidity-pool/pool-id', async () => {
    const result = await service.getLiquidityPoolByPoolId(PoolInfo.TYPE_SCRIPTS['GLIA'].toHash());
    expect(result).toEqual(service.toPoolInfo(mockGliaPoolInfo, PoolInfo.TYPE_SCRIPTS['ckETH']));
  });
});
