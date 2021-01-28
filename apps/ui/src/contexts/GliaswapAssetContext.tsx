import { Asset, GliaswapAPI, GliaswapAssetWithBalance, isCkbAsset, isEthAsset } from '@gliaswap/commons';
import { useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCallback } from 'react';
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

  const { signer, status: connectStatus, raw } = useWalletAdapter<Web3ModalAdapter>();
  const lockScript = useMemo(() => {
    if (connectStatus !== 'connected') return null;
    return signer.address.toLockScript();
  }, [connectStatus, signer.address]);

  const currentEthAddress = useMemo(() => {
    if (connectStatus === 'connected') return signer.address.addressString;
    return '';
  }, [signer.address, connectStatus]);

  const { data, status } = useQuery(
    ['getAssetsWithBalance', api, lockScript],
    () => api.getAssetsWithBalance(lockScript!, assetList, currentEthAddress, raw.web3),
    { refetchInterval: 3000, enabled: lockScript != null && !!raw.web3 },
  );

  const setBalance = useCallback(
    (assetList: Asset[]) => {
      const updatedAssets = assetList.map((asset) => {
        let target = {
          ...asset,
          balance: '',
        } as GliaswapAssetWithBalance;
        if (isEthAsset(asset)) {
          const updated = data?.filter(isEthAsset).find((a) => a.address === asset.address);
          target = updated ?? target;
        } else if (isCkbAsset(asset)) {
          const updated = data?.filter(isCkbAsset).find((a) => a.typeHash === asset.typeHash);
          target = updated ?? target;
        }
        return target;
      });
      setAssetsWithBalance({ lastUpdated: Date.now(), value: updatedAssets });
    },
    [data],
  );

  useEffect(() => {
    if (connectStatus !== 'connected') {
      setAssetsWithBalance({ lastUpdated: Date.now(), value: assetsWithBalance.value.map(createAssetWithBalance) });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectStatus]);

  useEffect(() => {
    if (status !== 'success' || !data) return;
    setBalance(assetList);
  }, [status, assetList, setBalance, data]);

  return (
    <AssetManagerContext.Provider value={{ assets: assetsWithBalance, api }}>{children}</AssetManagerContext.Provider>
  );
};

export function useGliaswapContext(): AssetManagerState {
  const context = useContext(AssetManagerContext);
  if (!context) throw new Error('The GliaswapContext.Provider is not found');

  return context;
}
