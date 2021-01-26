import { LiquidityInfo, Maybe } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { useGliaswap } from 'contexts';
import { QueryObserverResult, useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

interface LiquidityDetail {
  poolLiquidityQuery: QueryObserverResult<Maybe<LiquidityInfo>>;
  lockLiquidityQuery: QueryObserverResult<Maybe<LiquidityInfo & { share: number }>>;
}

export function useQueryLiquidityInfo(inputPoolId?: string): QueryObserverResult<Maybe<LiquidityInfo>> {
  const { api } = useGliaswap();

  const { poolId: paramPoolId } = useParams<{ poolId: string }>();
  const poolId = inputPoolId ?? paramPoolId;

  return useQuery<Maybe<LiquidityInfo>>(['getLiquidityInfo', poolId], async () => {
    return api.getLiquidityInfo({ poolId });
  });
}

// function balanceToZero(asset: CkbAssetWithBalance): CkbAssetWithBalance {
//   return update(asset, { balance: { $set: '0' } });
// }

export function useLiquidityQuery(inputPoolId?: string): LiquidityDetail {
  const { poolId: paramPoolId } = useParams<{ poolId: string }>();
  const poolId = inputPoolId ?? paramPoolId;

  const { api, currentUserLock /*, realtimeAssets*/ } = useGliaswap();

  // const assets = realtimeAssets.value;

  const poolLiquidityQuery = useQueryLiquidityInfo(poolId);
  const lockLiquidityQuery = useQuery(
    ['getLiquidityInfo', poolId, currentUserLock],
    async () => {
      const lockLiquidity = await api.getLiquidityInfo({ lock: currentUserLock, poolId });
      const poolLiquidity = poolLiquidityQuery.data;
      if (!poolLiquidity || !lockLiquidity) return;

      const share = new BigNumber(lockLiquidity.lpToken.balance).div(poolLiquidity.lpToken.balance).toNumber();

      return { ...lockLiquidity, share };
    },
    { enabled: currentUserLock != null },
  );

  return {
    poolLiquidityQuery,
    lockLiquidityQuery,
  };
}
