import { MockRepositoryFactory } from '../../mockRepositoryFactory';
import { DexLiquidityPoolService } from '../../../service/dexLiquidityPoolService';
import { INFO_LOCK_CODE_HASH, INFO_LOCK_HASH_TYPE, POOL_INFO_TYPE_SCRIPT } from '../../../config';
import { mockGliaPoolInfo } from './mockData';

const mockRepository = MockRepositoryFactory.getDexRepositoryInstance();
const service = new DexLiquidityPoolService(mockRepository);

import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
sinonStubPromise(sinon);

describe('/v1/liquidity-pool', () => {
  const mock = mockRepository.mockCollectCells();
  beforeEach(async () => {
    const lock = {
      script: {
        code_hash: INFO_LOCK_CODE_HASH,
        hash_type: INFO_LOCK_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };

    mock
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
  });

  afterEach(async function () {
    mock.restore();
  });

  it('get /v1/liquidity-pool', async () => {
    const result = await service.getLiquidityPools();

    expect(result.length).toEqual(2);
    expect(result).toEqual([
      service.toPoolInfo(mockGliaPoolInfo, POOL_INFO_TYPE_SCRIPT[0]),
      service.toPoolInfo(mockGliaPoolInfo, POOL_INFO_TYPE_SCRIPT[1]),
    ]);
  });
});

describe('/v1/liquidity-pool/pool-id', () => {
  const mock = mockRepository.mockCollectCells();
  beforeEach(async () => {
    const lock = {
      script: {
        code_hash: INFO_LOCK_CODE_HASH,
        hash_type: INFO_LOCK_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };

    mock
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
  });

  afterEach(async function () {
    mock.restore();
  });

  it('get /v1/liquidity-pool/pool-id', async () => {
    const result = await service.getLiquidityPoolByPoolId(POOL_INFO_TYPE_SCRIPT[1].toHash());
    expect(result).toEqual(service.toPoolInfo(mockGliaPoolInfo, POOL_INFO_TYPE_SCRIPT[1]));
  });
});
