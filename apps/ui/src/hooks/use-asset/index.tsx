import React, { createContext, useContext, useState } from 'react';

interface Balanced {
  balance: string;
}

export interface Asset {
  name: string;
  decimals: number;
  symbol?: string;
  logoURI?: string;
}

export interface Sudt extends Asset {
  type: {
    codeHash: string;
    args: string;
    hashType: string;
  };
}

export function isSudt(x: Asset): x is Sudt {
  return 'type' in x;
}

export interface Erc20 extends Asset {
  address: string;
}

export function isErc20(x: Asset): x is Erc20 {
  return 'address' in x;
}

export type RealtimeInfo<T> = {
  // unix timestamp milliseconds
  lastUpdated: number;
  // status: 'pending' | 'fulfilled' | 'rejected';
  value: T;
};

interface SudtWithBalance extends Sudt, Balanced {}

interface Erc20WithBalance extends Erc20, Balanced {}

export interface AssetManagerState {
  sudtList: RealtimeInfo<SudtWithBalance[]>;
  erc20List: RealtimeInfo<Erc20WithBalance[]>;
  ckbBalance: RealtimeInfo<string>;
  ethBalance: RealtimeInfo<string>;
}

const AssetManagerContext = createContext<AssetManagerState>({
  sudtList: { lastUpdated: 0, value: [] },
  erc20List: { lastUpdated: 0, value: [] },
  ckbBalance: { lastUpdated: 0, value: '0' },
  ethBalance: { lastUpdated: 0, value: '0' },
});

interface ProviderProps {
  sudtList: Sudt[];
  erc20List: Erc20[];
}

export const Provider: React.FC<ProviderProps> = (props) => {
  const { children } = props;

  const [ckbBalance, setCkbBalance] = useState<RealtimeInfo<string>>({ lastUpdated: 0, value: '0' });
  const [ethBalance, setEthBalance] = useState<RealtimeInfo<string>>({ lastUpdated: 0, value: '0' });

  const [sudtList, setSudtList] = useState<RealtimeInfo<SudtWithBalance[]>>({ lastUpdated: 0, value: [] });
  const [erc20List, setErc20List] = useState<RealtimeInfo<Erc20WithBalance[]>>({ lastUpdated: 0, value: [] });

  return (
    <AssetManagerContext.Provider value={{ sudtList, erc20List, ckbBalance, ethBalance }}>
      <div>{children}</div>
    </AssetManagerContext.Provider>
  );
};

export function useAsset() {
  return useContext(AssetManagerContext);
}
