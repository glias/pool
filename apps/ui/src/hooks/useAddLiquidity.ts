// the uniswap-model liquidity

import { CkbAssetWithBalance, price, SerializedTransactionToSignWithFee } from '@gliaswap/commons';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { useQueryLiquidityInfo } from 'hooks/useLiquidityQuery';
import { zip } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BalanceWithDecimal, BalanceWithoutDecimal, BN, createAssetWithBalance } from 'suite';

interface UseAddLiquidityState {
  generateAddLiquidityTransaction: (balances?: string[]) => Promise<SerializedTransactionToSignWithFee>;
  onUserInputReadyToAddLiquidity: (val: string, assetIndex: number) => BalanceWithoutDecimal[];
  userFreeAssets: CkbAssetWithBalance[];
  readyToAddLiquidity: BalanceWithoutDecimal[] | undefined;
  addShare: number;
}

export function useAddLiquidity(): UseAddLiquidityState {
  const { api, currentUserLock } = useGliaswap();
  const { ckbAssets: allCkbAssets } = useGliaswapAssets();
  const { data: poolLiquidity } = useQueryLiquidityInfo();
  const [{ slippage }] = useGlobalSetting();

  const [readyToAddLiquidity, setReadyToAddLiquidity] = useState<BalanceWithoutDecimal[] | undefined>();

  const { assets: poolAssets } = poolLiquidity ?? {};

  useEffect(() => {
    if (readyToAddLiquidity || !poolAssets) return;

    setReadyToAddLiquidity(poolAssets.map((asset) => BalanceWithoutDecimal.from(0, asset.decimals)));
  }, [readyToAddLiquidity, poolAssets]);

  const addShare = useMemo(() => {
    if (!readyToAddLiquidity || !poolAssets || !poolLiquidity) return 0;

    return price
      .getAddLiquidityReceiveLPAmount(
        readyToAddLiquidity[0].value,
        BalanceWithoutDecimal.fromAsset(poolAssets[0]).value,
        BalanceWithoutDecimal.fromAsset(poolLiquidity.lpToken).value,
      )
      .div(BalanceWithoutDecimal.fromAsset(poolAssets[0]).value)
      .toNumber();
  }, [poolAssets, poolLiquidity, readyToAddLiquidity]);

  function onUserInputReadyToAddLiquidity(inputValue: string, inputIndex: number) {
    if (!inputValue || !/^\d+(\.\d*)?$/.test(inputValue) || !poolLiquidity) {
      throw new Error(`${inputValue} is not a valid input`);
    }
    if (!readyToAddLiquidity) throw new Error('Pool is not loaded');

    const inputAmount = BalanceWithDecimal.from(
      inputValue,
      readyToAddLiquidity[inputIndex].assetDecimals,
    ).withoutDecimal();

    const inputPoolReserve = BalanceWithoutDecimal.fromAsset(poolLiquidity.assets[inputIndex]);

    const newReady = zip(readyToAddLiquidity, poolLiquidity.assets).map(([ready, poolAsset], i) => {
      if (i === inputIndex) return inputAmount;
      return ready!.newValue(
        price.getAddLiquidityPairedAssetPayAmount(inputAmount.value, inputPoolReserve.value, BN(poolAsset!.balance)),
      );
    });

    setReadyToAddLiquidity(newReady);
    return newReady;
  }

  const userFreeAssets = useMemo(() => {
    if (!poolAssets) return [];

    return poolAssets.map((poolAsset) => {
      const found = allCkbAssets.find((userAsset) => userAsset.typeHash === poolAsset.typeHash);
      if (found) return found;
      return createAssetWithBalance(poolAsset, '0');
    });
  }, [allCkbAssets, poolAssets]);

  const generateAddLiquidityTransaction = useCallback(
    (_inputBalances?: string[]) => {
      if (!poolLiquidity) throw new Error('The pool is not loaded');
      if (!currentUserLock) throw new Error('Cannot find the current user, maybe wallet is disconnected');
      if (!readyToAddLiquidity) throw new Error('');

      const balances = readyToAddLiquidity.map((ready) => ready.value.toString());
      const [asset1, asset2] = poolLiquidity.assets;

      return api.generateAddLiquidityTransaction({
        poolId: poolLiquidity.poolId,
        lock: currentUserLock,
        assetsWithDesiredAmount: [
          createAssetWithBalance(asset1, balances[0]),
          createAssetWithBalance(asset2, balances[1]),
        ],
        assetsWithMinAmount: [
          createAssetWithBalance(asset1, BN(balances[0]).times(1 - slippage)),
          createAssetWithBalance(asset2, BN(balances[1]).times(1 - slippage)),
        ],
        tips: createAssetWithBalance(asset1, '0'),
      });
    },
    [api, currentUserLock, poolLiquidity, readyToAddLiquidity, slippage],
  );

  return {
    generateAddLiquidityTransaction,
    userFreeAssets,
    onUserInputReadyToAddLiquidity,
    addShare,
    readyToAddLiquidity,
  };
}
