// the uniswap-model liquidity

import { CkbAssetWithBalance, price, SerializedTransactionToSignWithFee, TransactionHelper } from '@gliaswap/commons';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { useQueryLiquidityInfo } from 'hooks/useLiquidityQuery';
import { zip } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { BalanceWithDecimal, BalanceWithoutDecimal, BN, createAssetWithBalance } from 'suite';

interface UseAddLiquidityState {
  generateAddLiquidityTransaction: (balances?: string[]) => Promise<SerializedTransactionToSignWithFee>;
  sendReadyToAddLiquidityTransaction: () => Promise<string>;
  onUserInputReadyToAddLiquidity: (val: string, assetIndex: number) => BalanceWithoutDecimal[];
  userFreeAssets: CkbAssetWithBalance[];
  readyToAddLiquidity: BalanceWithoutDecimal[] | undefined;
  readyToAddShare: number;
}

export function useAddLiquidity(): UseAddLiquidityState {
  const { api, currentUserLock, adapter } = useGliaswap();
  const { ckbAssets: allCkbAssets } = useGliaswapAssets();
  const { data: poolLiquidity } = useQueryLiquidityInfo();
  const [{ slippage }] = useGlobalSetting();
  const queryClient = useQueryClient();

  const [readyToAddLiquidity, setReadyToAddLiquidity] = useState<BalanceWithoutDecimal[] | undefined>();
  const [readyToAddLiquidityTransaction, setReadyToAddLiquidityTransaction] = useState<
    SerializedTransactionToSignWithFee | undefined
  >(undefined);

  const { assets: poolAssets } = poolLiquidity ?? {};

  useEffect(() => {
    if (readyToAddLiquidity || !poolAssets) return;

    setReadyToAddLiquidity(poolAssets.map((asset) => BalanceWithoutDecimal.from(0, asset.decimals)));
  }, [readyToAddLiquidity, poolAssets]);

  const readyToAddShare = useMemo(() => {
    if (!readyToAddLiquidity || !poolLiquidity) return 0;
    const poolLPTokenTotal = BalanceWithoutDecimal.fromAsset(poolLiquidity.lpToken);

    if (!readyToAddLiquidity || !poolAssets || !poolLiquidity) return 0;
    const share = price
      .getAddLiquidityReceiveLPAmount(
        readyToAddLiquidity[0].value,
        BalanceWithoutDecimal.fromAsset(poolAssets[0]).value,
        poolLPTokenTotal.value,
      )
      .div(poolLPTokenTotal.value)
      .toNumber();

    return share;
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

    const nextReadyToAddLiquidity = zip(readyToAddLiquidity, poolLiquidity.assets).map(([ready, poolAsset], i) => {
      if (i === inputIndex) return inputAmount;
      // the reserve is is zero means that the pool has not been genesis
      // genesis liquidity is defined by the user
      // so no price calculation is performed for this operation
      if (inputPoolReserve.value.eq(0) || BN(poolAsset?.balance || 0).eq(0)) {
        return (
          ready ?? BalanceWithoutDecimal.from(BN(1).times(10 ** (poolAsset?.decimals ?? 1)), poolAsset?.decimals || 0)
        );
      }

      return ready!.newValue(
        price.getAddLiquidityPairedAssetPayAmount(inputAmount.value, inputPoolReserve.value, BN(poolAsset!.balance)),
      );
    });

    setReadyToAddLiquidity(nextReadyToAddLiquidity);
    return nextReadyToAddLiquidity;
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
    async (_inputBalances?: string[]) => {
      if (!poolLiquidity) throw new Error('The pool is not loaded');
      if (!currentUserLock) throw new Error('Cannot find the current user, maybe wallet is disconnected');
      if (!readyToAddLiquidity) throw new Error('');

      const balances = readyToAddLiquidity.map((ready) => ready.value.toString());
      const [asset1, asset2] = poolLiquidity.assets;

      const tx = await api.generateAddLiquidityTransaction({
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

      setReadyToAddLiquidityTransaction(tx);
      return tx;
    },
    [api, currentUserLock, poolLiquidity, readyToAddLiquidity, slippage],
  );

  async function sendReadyToAddLiquidityTransaction(): Promise<string> {
    if (!readyToAddLiquidityTransaction) throw new Error('Cannot find the ready to add liquidity transaction');
    const txHash = await adapter.signer.sendTransaction(
      TransactionHelper.deserializeTransactionToSign(readyToAddLiquidityTransaction.transactionToSign),
    );

    setReadyToAddLiquidityTransaction(undefined);
    await queryClient.invalidateQueries('getLiquidityOperationSummaries');
    return txHash;
  }

  return {
    generateAddLiquidityTransaction,
    userFreeAssets,
    onUserInputReadyToAddLiquidity,
    readyToAddShare: readyToAddShare,
    readyToAddLiquidity,
    sendReadyToAddLiquidityTransaction,
  };
}
