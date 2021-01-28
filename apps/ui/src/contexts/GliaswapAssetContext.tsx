import { Asset, GliaswapAPI, GliaswapAssetWithBalance } from '@gliaswap/commons';
import { useWalletAdapter } from 'commons/WalletAdapter';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { createAssetWithBalance } from 'suite';

export type RealtimeInfo<T> = {
  // unix timestamp milliseconds
  lastUpdated: number;
  // status: 'pending' | 'fulfilled' | 'rejected';
  value: T;
};

type RealtimeAssetsWithBalance = RealtimeInfo<GliaswapAssetWithBalance[]>;

interface AssetManagerState {
  assets: RealtimeAssetsWithBalance;
  api: GliaswapAPI;
}

const AssetManagerContext = createContext<AssetManagerState | null>(null);

type ProviderProps = React.PropsWithChildren<{
  assetList: Asset[];
  api: GliaswapAPI;
}>;

export const Provider: React.FC<ProviderProps> = (props) => {
  const { children, assetList, api } = props;
  const [assetsWithBalance, setAssetsWithBalance] = useState<RealtimeAssetsWithBalance>({
    lastUpdated: 0,
    value: assetList.map((asset) => ({ ...asset, balance: '0' } as GliaswapAssetWithBalance)),
  });

  const { signer, status: connectStatus } = useWalletAdapter();
  const lockScript = useMemo(() => {
    if (connectStatus !== 'connected') return null;
    return signer.address.toLockScript();
  }, [connectStatus, signer.address]);

  const { data, status } = useQuery(
    ['getAssetsWithBalance', api, lockScript],
    () => api.getAssetsWithBalance(lockScript!, assetList),
    { refetchInterval: 3000, enabled: lockScript != null },
  );

  useEffect(() => {
    if (connectStatus !== 'connected') {
      setAssetsWithBalance({ lastUpdated: Date.now(), value: assetsWithBalance.value.map(createAssetWithBalance) });
      return;
    }

    if (status !== 'success' || !data || assetsWithBalance.value === data) return;
    setAssetsWithBalance({ lastUpdated: Date.now(), value: data });
  }, [status, data, connectStatus, assetsWithBalance]);

  return (
    <AssetManagerContext.Provider value={{ assets: assetsWithBalance, api }}>{children}</AssetManagerContext.Provider>
  );
};

export function useGliaswapContext(): AssetManagerState {
  const context = useContext(AssetManagerContext);
  if (!context) throw new Error('The GliaswapContext.Provider is not found');

  return context;
}
