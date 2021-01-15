import { Asset } from '@gliaswap/commons';
import { Provider as AdapterProvider, useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { Provider as AssetProvider, useAsset } from 'contexts/GliaswapContext';
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

export function useGliaswap() {
  const adapter = useWalletAdapter<Web3ModalAdapter>();
  const { assets } = useAsset();

  return { adapter, assets };
}
