import {
  AssetManagerAPI,
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  GliaswapAssetWithBalance,
  isCkbAsset,
} from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import { useConstant } from 'commons/use-constant';
import { DummyAssetManagerAPI } from 'components/AssetManager/suite/api/DummyAssetManagerFetcher';
import { useGliaswap } from 'hooks';
import { useCallback, useMemo, useState } from 'react';
import { CKB_NATIVE_TYPE_HASH, Placeholder } from 'suite';
import { createContainer } from 'unstated-next';

export type ManagerAsset = CkbNativeAssetWithBalance | CkbSudtAssetWithBalance;

function isCkbAssetWithBalanced(asset: GliaswapAssetWithBalance): asset is ManagerAsset {
  return isCkbAsset(asset);
}

interface AssetManagerValue {
  assetAPI: AssetManagerAPI;
  assets: ManagerAsset[];
  currentAsset: ManagerAsset;
  upcomingTransaction: Transaction | null;

  setTypeHash: (typeHash?: string) => void;
  sendConfirmingTx: () => Promise<string>;
}

const AssetManagerContainer = createContainer<AssetManagerValue>(
  (): AssetManagerValue => {
    const [typeHash, setTypeHash] = useState<string>(CKB_NATIVE_TYPE_HASH);
    const [confirmingTx, setConfirmingTx] = useState<Transaction | null>(null);

    // TODO replace me
    const assetAPI = useConstant<AssetManagerAPI>(() => new DummyAssetManagerAPI());
    const { realtimeAssets: allAssets, adapter } = useGliaswap();

    const ckbAssets = useMemo(() => allAssets.value.filter<ManagerAsset>(isCkbAssetWithBalanced), [allAssets]);
    const currentAsset = useMemo(() => {
      const found = ckbAssets.find((asset) => asset.typeHash === typeHash);
      if (!found) return Placeholder.ckbNativeWithBalance;
      return found;
    }, [ckbAssets, typeHash]);

    const setCurrentTypeHash = useCallback((typeHash?: string) => {
      if (!typeHash) return setTypeHash(CKB_NATIVE_TYPE_HASH);
      setTypeHash(typeHash);
    }, []);

    const sendConfirmingTx = useCallback(async () => {
      if (!confirmingTx) throw new Error('Cannot found confirming transaction');
      const txHash = await adapter.signer.sendTransaction(confirmingTx);
      setConfirmingTx(null);
      return txHash;
    }, [adapter, confirmingTx]);

    return {
      upcomingTransaction: confirmingTx,
      sendConfirmingTx,
      assetAPI,
      setTypeHash: setCurrentTypeHash,
      assets: ckbAssets,
      currentAsset: currentAsset!,
    };
  },
);

export function useAssetManager() {
  return AssetManagerContainer.useContainer();
}

export const Provider: React.FC = (props) => {
  return <AssetManagerContainer.Provider>{props.children}</AssetManagerContainer.Provider>;
};
