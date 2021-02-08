import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ConnectStatus, Signer, Wallet, WalletAdapter } from './types';

type NoNillable<T> = T extends null | undefined ? never : T;

export type ConnectedAdapterState<T extends Wallet<any, any>> = {
  status: 'connected';
  signer: NoNillable<T['signer']>;
  raw: T;
} & Pick<T, 'connect' | 'disconnect'>;

export type UnconnectedAdapterState<T extends Wallet<any, any>> = {
  status: 'disconnected' | 'connecting';
  signer: null;
  raw: T;
} & Pick<T, 'connect' | 'disconnect'>;

export type AdapterContextState<T extends Wallet<any, any>> = ConnectedAdapterState<T> | UnconnectedAdapterState<T>;

export const AdapterContext = createContext<AdapterContextState<any> | null>(null);

interface ProviderProps<Unsigned, Signed> {
  adapter: WalletAdapter<Unsigned, Signed>;
}

export function Provider<Unsigned, Signed>(props: PropsWithChildren<ProviderProps<Unsigned, Signed>>) {
  const { children, adapter } = props;

  const [[status, signer], setConnector] = useState<[ConnectStatus, Signer<any, any> | null]>(() => [
    'disconnected',
    null,
  ]);

  useEffect(() => {
    if (!adapter?.on) return;
    adapter.on('connectStatusChanged', (status, connectedSigner) => {
      setConnector([status, connectedSigner ?? null]);
    });
    adapter.on('signerChanged', (newSigner) => {
      setConnector(['connected', newSigner]);
    });
  }, [adapter]);

  const connect = useCallback(() => {
    return adapter?.connect();
  }, [adapter]);

  const disconnect = useCallback(() => {
    return adapter?.disconnect();
  }, [adapter]);

  const state = { connect, disconnect, raw: adapter, signer, status } as AdapterContextState<any>;
  return <AdapterContext.Provider value={state}>{children}</AdapterContext.Provider>;
}

export function useWalletAdapter<Adapter extends WalletAdapter<any, any>>(): AdapterContextState<Adapter> {
  const adapter = useContext(AdapterContext);
  if (adapter === null) {
    throw new Error(
      `Adapter is not found, maybe the current component is not a child of ${AdapterContext.Provider.name}`,
    );
  }
  return adapter;
}
