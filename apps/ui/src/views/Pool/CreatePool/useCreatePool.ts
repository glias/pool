import { CkbAssetWithBalance, CkbModel, PoolInfo, PoolInfoWithStatus } from '@gliaswap/commons';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import update from 'immutability-helper';
import { sortBy } from 'lodash';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { createAssetWithBalance } from 'suite';

type PoolWithStatus =
  | { status: 'unknown' | 'uncreated' }
  | { status: 'pending' | 'created' | 'liquid'; pool: PoolInfo };

interface CreatePoolState {
  selectedAssets: CkbAssetWithBalance[];
  setAssetWithIndex: (asset: CkbAssetWithBalance, index: number) => void;
  poolWithStatus: PoolWithStatus;
  clearAssets: () => void;
  /**
   * send a create pool transaction
   */
  sendCreatePoolTransaction: () => Promise<string>;
}

export function useCreatePool(): CreatePoolState {
  const poolAssetsNum = 2;
  const poolModel = 'UNISWAP';

  const { api, assertsConnectedAdapter, currentUserLock } = useGliaswap();
  const { ckbNativeAsset } = useGliaswapAssets();
  const [selectedAssets, setSelectedAssets] = useState<CkbAssetWithBalance[]>(
    ckbNativeAsset ? [createAssetWithBalance(ckbNativeAsset)] : [],
  );
  const queryClient = useQueryClient();

  const typeHashes = useMemo<string>(() => sortBy(selectedAssets.map(CkbModel.identity)).join(''), [selectedAssets]);
  const { data: pool, status } = useQuery(
    ['getPoolInfoWithStatus', { typeHashes }],
    () => api.getPoolInfoWithStatus({ assets: selectedAssets }),
    { enabled: selectedAssets.length === poolAssetsNum },
  );

  const poolWithStatus = useMemo<PoolWithStatus>(() => {
    if (status !== 'success') return { status: 'unknown' };
    if (!pool) return { status: 'uncreated' };
    if (pool.status === 'pending') return { status: 'pending', pool };
    if (pool.status === 'completed' && Number(pool.assets[0].balance ?? 0) === 0) return { status: 'created', pool };
    return { status: 'liquid', pool };
  }, [pool, status]);

  function clearAssets(): void {
    setSelectedAssets([]);
  }

  function setAssetWithIndex(asset: CkbAssetWithBalance, index: number) {
    setSelectedAssets((assets) => update(assets, { $splice: [[index, 1, asset]] }));
  }

  async function sendCreatePoolTransaction(): Promise<string> {
    if (selectedAssets.length < poolAssetsNum) {
      const actual = selectedAssets.length;
      throw new Error(`Insufficient number of assets, total need ${poolAssetsNum}, actual only ${actual}`);
    }
    if (!currentUserLock) throw new Error('Cannot find the current user, maybe wallet is disconnected');
    const res = await api.generateCreateLiquidityPoolTransaction({ assets: selectedAssets, lock: currentUserLock });
    const adapter = assertsConnectedAdapter();
    const txHash = await adapter.signer.sendTransaction(res.transactionToSign);
    queryClient.setQueryData<PoolInfoWithStatus>(['getPoolInfoWithStatus', { typeHashes }], () => ({
      poolId: '0x',
      status: 'pending',
      assets: selectedAssets,
      model: poolModel,
    }));
    return txHash;
  }

  return {
    selectedAssets,
    clearAssets,
    setAssetWithIndex,
    poolWithStatus,
    sendCreatePoolTransaction,
  };
}
