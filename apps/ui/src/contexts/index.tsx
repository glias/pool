import { Asset } from '@gliaswap/commons';
import { Provider as AdapterProvider } from 'commons/WalletAdapter';
import { Provider as AssetProvider } from 'contexts/GliaswapAssetContext';
import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useGlobalConfig } from './config';

export const GliaswapProvider: React.FC = (props) => {
  const { api, adapter } = useGlobalConfig();
  const [assetList, setAssetList] = useState<Asset[]>([]);

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
