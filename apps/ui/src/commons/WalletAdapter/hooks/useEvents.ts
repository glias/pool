import { useEffect, useState } from 'react';
import { Web3ModalAdapter } from '../adapters/Web3ModalAdapter';
import { useWalletAdapter } from '../Provider';

export function useChainId(): { chainId: string | null } {
  const { raw } = useWalletAdapter<Web3ModalAdapter>();
  const [chainId, setChainId] = useState<string | null>(null);

  const provider = raw?.provider;

  useEffect(() => {
    if (!provider) return;
    if (provider.chainId) setChainId(provider.chainId);
    provider.on('chainChanged', setChainId);
    return () => provider.removeListener('chainChained', setChainId);
  }, [provider]);

  return { chainId };
}
