import { Asset, GliaswapAPI, GliaswapAssetWithBalance, Script } from '@gliaswap/commons';
import { ConnectStatus, Provider as AdapterProvider, useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { AdapterContextState } from 'commons/WalletAdapter/Provider';
import { Provider as AssetProvider, RealtimeInfo, useGliaswapContext } from 'contexts/GliaswapAssetContext';
import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useGlobalConfig } from './config';

export const GliaswapProvider: React.FC = (props) => {
  const { api, adapter } = useGlobalConfig();
  const [assetList, setAssetList] = useState<Asset[]>(api.getDefaultAssetList());

  useEffect(() => {
    (async () => {
      const list = await api.getAssetList();
      setAssetList(list);
    })();
  }, [api]);

  const queryClient = useMemo(() => {
    return new QueryClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AdapterProvider adapter={adapter}>
        <AssetProvider api={api} assetList={assetList}>
          {props.children}
        </AssetProvider>
      </AdapterProvider>
    </QueryClientProvider>
  );
};

interface GliaswapState {
  /**
   * the WalletConnectAdapter
   * @see {AdapterContextState}
   */
  adapter: AdapterContextState<Web3ModalAdapter>;
  // global assets info with balance
  realtimeAssets: RealtimeInfo<GliaswapAssetWithBalance[]>;
  /**
   * an implement of GliaswapAPI
   * @see {GliaswapAPI}
   */
  api: GliaswapAPI;
  // wallet connect status
  walletConnectStatus: ConnectStatus;
  // when a wallet was connected, the user lock would be filled
  currentUserLock?: Script;

  currentCkbAddress: string;

  currentEthAddress: string;
}

export function useGliaswap(): GliaswapState {
  const adapter = useWalletAdapter<Web3ModalAdapter>();
  const { assets, api } = useGliaswapContext();

  const currentUserLock = useMemo(() => {
    if (adapter.status === 'connected') return adapter.signer.address.toLockScript();
    return undefined;
  }, [adapter.signer.address, adapter.status]);

  const currentCkbAddress = useMemo(() => {
    return currentUserLock?.toAddress().toCKBAddress() ?? '';
  }, [currentUserLock]);

  const currentEthAddress = useMemo(() => {
    if (adapter.status === 'connected') return adapter.signer.address.addressString;
    return '';
  }, [adapter.signer.address.addressString, adapter.status]);

  const walletConnectStatus = adapter.status;

  return {
    adapter,
    realtimeAssets: assets,
    walletConnectStatus,
    api,
    currentUserLock,
    currentCkbAddress,
    currentEthAddress,
  };
}
