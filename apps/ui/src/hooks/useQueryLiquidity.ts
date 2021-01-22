import { AssetWithBalance, LiquidityInfo, Maybe } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { useGliaswap } from 'contexts';
import { QueryObserverResult, useQuery } from 'react-query';
import update from 'immutability-helper';

interface LiquidityInfoWithShare extends LiquidityInfo {
  share: number;
}

export function useQueryLiquidityInfo(poolId: string): QueryObserverResult<Maybe<LiquidityInfo>> {
  const { api } = useGliaswap();

  return useQuery<Maybe<LiquidityInfo>>(['getLiquidityInfo', poolId], () => {
    return api.getLiquidityInfo({ poolId });
  });
}

function balanceToZero(asset: AssetWithBalance): AssetWithBalance {
  return update(asset, { balance: { $set: '0' } });
}

export function useQueryLiquidityWithShare(poolId: string): QueryObserverResult<Maybe<LiquidityInfoWithShare>> {
  const { api, currentUserLock } = useGliaswap();

  const { data: poolLiquidity, status: poolLiquidityStatus } = useQueryLiquidityInfo(poolId);
  const { data: lockLiquidity, status: lockLiquidityStatus } = useQuery(
    ['getLiquidityInfo', poolId, currentUserLock],
    () => api.getLiquidityInfo({ lock: currentUserLock, poolId }),
    { enabled: currentUserLock != null },
  );

  return useQuery<Maybe<LiquidityInfoWithShare>>(
    ['getLiquidityInfoWithShare', poolLiquidity, lockLiquidity],
    () => {
      if (!poolLiquidity || !lockLiquidity) return;

      if (!lockLiquidity) {
        const liquidityInfo = update(poolLiquidity, {
          lpToken: balanceToZero,
          assets: (assets) => assets.map(balanceToZero),
        });
        return { ...liquidityInfo, share: 0 };
      }

      const share = new BigNumber(lockLiquidity.lpToken.balance).div(poolLiquidity.lpToken.balance);
      return { ...lockLiquidity, share: share.toNumber() };
    },
    {
      enabled: poolLiquidityStatus === 'success' && lockLiquidityStatus === 'success',
    },
  );
}
