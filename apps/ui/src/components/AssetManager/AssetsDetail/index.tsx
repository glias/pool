import { Operations } from 'components/AssetManager/AssetBalance';
import { BalanceStatus } from 'components/AssetManager/AssetBalance/BalanceStatus';
import { AssetManagerHeader } from 'components/AssetManager/AssetManagerHeader';
import { useAssetManager } from 'components/AssetManager/hooks';
import React from 'react';
// import { TransactionList } from 'components/AssetManager/TransactionList';

export const AssetDetail = () => {
  const { currentAsset } = useAssetManager();

  return (
    <>
      <AssetManagerHeader showGoBack />
      <BalanceStatus asset={currentAsset} showAssetSymbolIcon />
      <Operations />
      {/*<TransactionList />*/}
    </>
  );
};
