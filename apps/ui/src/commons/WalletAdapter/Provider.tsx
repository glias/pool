import { createContext, useCallback, useContext, useState } from 'react';
import { dummyAdapter, dummySigner, throwDisconnected } from './adapters/Web3ModalAdapter';
import { ConnectStatus, Signer, WalletAdapter } from './types';

type Proxies<T, key extends keyof T> = T[key];

export interface AdapterContextState<T extends WalletAdapter = WalletAdapter> {
  status: ConnectStatus;
  signer: Signer;

  connect: Proxies<T, 'connect'>;

  raw: T;
}

const AdapterContext = createContext<AdapterContextState | null>(null);

interface ProviderProps {
  adapter: WalletAdapter;
}

export const Provider: React.FC<ProviderProps> = (props) => {
  const { children, adapter } = props;

  const [status, setStatus] = useState<ConnectStatus>('disconnected');
  const [signer, setSigner] = useState<Signer>(dummySigner);

  const signerChangedSuccess = useCallback((signer: Signer) => {
    setSigner(signer);
    setStatus('connected');
    return signer;
  }, []);

  const signerChangedFailed = useCallback((rejected: unknown) => {
    console.log('failed', rejected);

    setSigner(dummySigner);
    setStatus('disconnected');
    return rejected;
  }, []);

  const connect: AdapterContextState['connect'] = useCallback(
    (config?: unknown) => {
      setStatus('connecting');

      adapter.on('signerChanged', async (signerResolver) => {
        setStatus('connecting');
        Promise.resolve(signerResolver).then(signerChangedSuccess, signerChangedFailed);
      });

      return adapter.connect(config).then(signerChangedSuccess, signerChangedFailed) as Promise<Signer>;
    },
    [adapter, signerChangedSuccess, signerChangedFailed],
  );

  const providerValue: AdapterContextState = { status, connect, signer, raw: adapter };
  return <AdapterContext.Provider value={providerValue}>{children}</AdapterContext.Provider>;
};

export function useAdapter<T extends WalletAdapter>(): AdapterContextState<T> {
  const context = useContext(AdapterContext);

  if (context == null) {
    return {
      connect: throwDisconnected(),
      signer: dummySigner,
      raw: dummyAdapter as T,
      status: 'disconnected',
    };
  }

  return context as AdapterContextState<T>;
}
