import { LiquidityInfo, Maybe } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { useGliaswap } from 'hooks';
import { QueryObserverResult, useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { BN } from 'suite';

interface LiquidityDetail {
  poolLiquidityQuery: QueryObserverResult<Maybe<LiquidityInfo>>;
  userLiquidityQuery: QueryObserverResult<Maybe<LiquidityInfo & { share: number }>>;
}

export function useQueryLiquidityInfo(poolId?: string): QueryObserverResult<Maybe<LiquidityInfo>> {
  const { api } = useGliaswap();

  return useQuery<Maybe<LiquidityInfo>>(
    ['getLiquidityInfo', poolId],
    async () => {
      if (!poolId) return;
      return api.getLiquidityInfo({ poolId });
    },
    { enabled: !!poolId },
  );
}

export function useLiquidityDetail(inputPoolId?: string): LiquidityDetail {
  const { poolId: paramPoolId } = useParams<{ poolId: string }>();
  const poolId = inputPoolId ?? paramPoolId;

  const { api, currentUserLock /*, realtimeAssets*/ } = useGliaswap();

  // const assets = realtimeAssets.value;

  const poolLiquidityQuery = useQueryLiquidityInfo(poolId);
  const userLiquidityQuery = useQuery(
    ['getLiquidityInfo', poolId, currentUserLock, poolLiquidityQuery.data],
    async () => {
      if (!currentUserLock) return;
      const userLiquidity = await api.getLiquidityInfo({ lock: currentUserLock, poolId });
      const poolLiquidity = poolLiquidityQuery.data;

      if (!poolLiquidity || !userLiquidity) return;
      // TODO HACK this is an server error now
      userLiquidity.assets.forEach((asset, i) => {
        asset.balance = BN(userLiquidity.lpToken.balance)
          .times(poolLiquidity.assets[i].balance)
          .div(poolLiquidity.lpToken.balance)
          .toString();
      });

      const share = new BigNumber(userLiquidity.lpToken.balance).div(poolLiquidity.lpToken.balance).toNumber();

      return { ...userLiquidity, share };
    },
  );

  return { poolLiquidityQuery, userLiquidityQuery };
}
