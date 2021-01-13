import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Asset, AssetWithBalance, RealtimeInfo } from './types';

interface AssetManagerState<A extends AssetWithBalance> {
  assets: RealtimeInfo<A[]>;
}

const AssetManagerContext = createContext<AssetManagerState<AssetWithBalance> | null>(null);

type ProviderProps<A extends AssetWithBalance> = React.PropsWithChildren<{
  assetList: Asset[];
  onStatefulAssetUpdate: (asset: Asset[]) => Promise<A[]>;
}>;

export function Provider<A extends AssetWithBalance>(props: ProviderProps<A>) {
  const { children } = props;
  const [realtimeAssets, setStatefulAssets] = useState<RealtimeInfo<AssetWithBalance[]>>({
    lastUpdated: 0,
    value: props.assetList.map((asset) => ({ ...asset, balance: '0' })),
  });

  const { data, status } = useQuery(['fetchStatefulAssets'], () => props.onStatefulAssetUpdate(realtimeAssets.value), {
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (status !== 'success' || !data) return;
    setStatefulAssets({ lastUpdated: Date.now(), value: data });
  }, [status, data]);

  return (
    <AssetManagerContext.Provider value={{ assets: realtimeAssets }}>
      <div>{children}</div>
    </AssetManagerContext.Provider>
  );
}

export function useAsset<A extends AssetWithBalance>(): AssetManagerState<A> {
  return useContext(AssetManagerContext) as AssetManagerState<A>;
}
