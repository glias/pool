import { Asset, EthModel, GliaswapAPI, GliaswapAssetWithBalance, isCkbAsset, isEthAsset } from '@gliaswap/commons';
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils';
import { useCrossChainOrdersContainer } from 'hooks/useCrossChainOrders';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { createAssetWithBalance } from 'suite';
import { BridgeAPI } from 'suite/api/bridgeAPI';

export type RealtimeInfo<T> = {
  // unix timestamp milliseconds
  lastUpdated: number;
  // status: 'pending' | 'fulfilled' | 'rejected';
  value: T;
};

type RealtimeAssetsWithBalance = RealtimeInfo<GliaswapAssetWithBalance[]>;

export interface AssetManagerState {
  assets: RealtimeAssetsWithBalance;
  api: GliaswapAPI;
  bridgeAPI: BridgeAPI;
  refreshAssetsWithBalance: () => Promise<unknown>;
}

const AssetManagerContext = createContext<AssetManagerState | null>(null);

type ProviderProps = React.PropsWithChildren<{
  assetList: Asset[];
  api: GliaswapAPI;
  bridgeAPI: BridgeAPI;
  address?: string;
}>;

export const Provider: React.FC<ProviderProps> = (props) => {
  const { children, assetList, api, bridgeAPI, address } = props;
  const [assetsWithBalance, setAssetsWithBalance] = useState<RealtimeAssetsWithBalance>({
    lastUpdated: 0,
    value: assetList.map((asset) => ({ ...asset, balance: '0' } as GliaswapAssetWithBalance)),
  });

  const lockScript = address ? addressToScript(address) : null;

  // const currentEthAddress = useMemo(() => {
  //   return lockScript?.args ?? '';
  // }, [lockScript]);

  const { data, status, refetch: refreshBalance } = useQuery(
    ['getAssetsWithBalance', { lock: lockScript }],
    () => api.getAssetsWithBalance(lockScript!, assetList),
    // TODO: use the env to define the refetchInterval
    { refetchInterval: 10000, enabled: lockScript != null },
  );

  const { pendingEthTrasnactionDict } = useCrossChainOrdersContainer();

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
    if (!lockScript) {
      setAssetsWithBalance({
        lastUpdated: Date.now(),
        value: assetsWithBalance.value.map((asset) => createAssetWithBalance(asset, 0)),
      });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockScript]);

  useEffect(() => {
    if (status !== 'success' || !data) return;
    setBalance(assetList);
  }, [status, assetList, setBalance, data]);

  useEffect(() => {
    if (status !== 'success' || !data) return;
    setAssetsWithBalance(() => {
      const assets = data;
      return {
        lastUpdated: Date.now(),
        value: assets.map((asset) => {
          if (EthModel.isCurrentChainAsset(asset)) {
            const pendingBalance = pendingEthTrasnactionDict[asset.address] ?? BigInt(0);
            const balance = BigInt(asset.balance) - pendingBalance;
            return {
              ...asset,
              balance: balance < 0 ? '0' : balance.toString(),
            };
          }
          return asset;
        }),
      };
    });
  }, [pendingEthTrasnactionDict, data, status]);

  return (
    <AssetManagerContext.Provider
      value={{ assets: assetsWithBalance, api, bridgeAPI, refreshAssetsWithBalance: refreshBalance }}
    >
      {children}
    </AssetManagerContext.Provider>
  );
};

export function useGliaswapContext(): AssetManagerState {
  const context = useContext(AssetManagerContext);
  if (!context) throw new Error('The GliaswapContext.Provider is not found');

  return context;
}
