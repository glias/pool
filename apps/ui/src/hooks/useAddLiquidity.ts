// the uniswap-model liquidity

import { price, SerializedTransactionToSignWithFee, TransactionHelper } from '@gliaswap/commons';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { useQueryLiquidityInfo } from 'hooks/useLiquidityQuery';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Amount, BN, createAssetWithBalance } from 'suite';

interface UseAddLiquidityState {
  onUserInputReadyToAddAmount: (amountWithDecimal: string, assetIndex: number) => (Amount | undefined)[] | undefined;
  generateAddLiquidityTransaction: (balances?: string[]) => Promise<SerializedTransactionToSignWithFee>;
  readyToAddLiquidityTransaction: SerializedTransactionToSignWithFee | undefined;
  /**
   * send the ready to add liquidity transaction and return the transaction hash
   */
  sendReadyToAddLiquidityTransaction: () => Promise<string>;
  /**
   * the balances of the current user
   */
  userFreeBalances: Amount[] | undefined;
  readyToAddAmounts: (Amount | undefined)[] | undefined;
  readyToAddShare: number;
  readyToReceiveLPAmount: Amount | undefined;
}

export function useAddLiquidity(): UseAddLiquidityState {
  const { api, currentUserLock, assertsConnectedAdapter } = useGliaswap();
  const { ckbAssets: userCkbAssets } = useGliaswapAssets();
  const { data: poolInfo } = useQueryLiquidityInfo();
  const [{ slippage }] = useGlobalSetting();
  const queryClient = useQueryClient();

  const [readyToAddAmounts, setReadyToAddAmounts] = useState<(Amount | undefined)[] | undefined>();
  const [readyToAddLiquidityTransaction, setReadyToAddLiquidityTransaction] = useState<
    SerializedTransactionToSignWithFee | undefined
  >(undefined);

  const isPoolGenesis = useMemo(() => {
    if (!poolInfo?.lpToken) return false;
    return Amount.fromAsset(poolInfo.lpToken).value.gt(0);
  }, [poolInfo]);

  const [readyToAddShare, readyToReceiveLPAmount] = useMemo<[number, Amount]>(() => {
    // the pool is not loaded
    if (!poolInfo || poolInfo.assets.length <= 0) return [0, Amount.fromZero(0)];
    if (!readyToAddAmounts || readyToAddAmounts.length <= 0 || !readyToAddAmounts[0] || !readyToAddAmounts[1]) {
      return [0, Amount.fromZero(poolInfo.lpToken.decimals)];
    }

    const poolLpTokenAmount = Amount.fromAsset(poolInfo.lpToken);
    // the lp token balance is 0 means that the pool is not genesis
    // no matter how much liquidity is added, share is always 100%
    // the genesis receive lp token amount is `sqrt(amount1 * amount2)`
    if (!isPoolGenesis) {
      return [
        1,
        Amount.from(
          BN(readyToAddAmounts[0].value).times(readyToAddAmounts[1].value).sqrt().decimalPlaces(0),
          poolInfo.lpToken.decimals,
        ),
      ];
    }

    const readyToReceiveLPAmount = price.getAddLiquidityReceiveLPAmount(
      readyToAddAmounts[0].value,
      Amount.fromAsset(poolInfo.assets[0]).value,
      poolLpTokenAmount.value,
    );

    const share = readyToReceiveLPAmount.div(poolLpTokenAmount.value.plus(readyToReceiveLPAmount)).toNumber();

    return [share, Amount.from(readyToReceiveLPAmount, poolInfo.lpToken.decimals)];
  }, [isPoolGenesis, poolInfo, readyToAddAmounts]);

  function onUserInputReadyToAddAmount(userInput: string, indexOfPoolAssets: number) {
    if (!poolInfo) {
      setReadyToAddAmounts(undefined);
      return;
    }

    if (!userInput || !/^\d+(\.\d*)?$/.test(userInput)) {
      setReadyToAddAmounts(undefined);
      return;
    }

    const poolAsset = poolInfo.assets[indexOfPoolAssets];

    const inputAmount = Amount.fromHumanize(userInput, poolAsset.decimals);
    const inputPoolReserve = Amount.fromAsset(poolAsset);

    const nextReadyToAddAmounts = poolInfo.assets.map<Amount | undefined>((asset, i) => {
      if (indexOfPoolAssets === i) return inputAmount;

      // if the pool is not genesis, the amount to be added for other assets is not calculated
      if (!isPoolGenesis) return readyToAddAmounts?.[i];

      const pairedAmount = price.getAddLiquidityPairedAssetPayAmount(
        inputAmount.value,
        inputPoolReserve.value,
        Amount.fromAsset(asset).value,
      );

      return Amount.from(pairedAmount, asset.decimals);
    });

    setReadyToAddAmounts(nextReadyToAddAmounts);
    return nextReadyToAddAmounts;
  }

  const userFreeBalances = useMemo(() => {
    if (!poolInfo) return;
    return poolInfo.assets.map((poolAsset) => {
      const found = userCkbAssets.find((userAsset) => poolAsset.typeHash === userAsset.typeHash);
      if (!found) return Amount.fromZero(poolAsset.decimals);
      return Amount.fromAsset(found);
    });
  }, [poolInfo, userCkbAssets]);

  const generateAddLiquidityTransaction = useCallback(
    async (_inputBalances?: string[]) => {
      if (!poolInfo) throw new Error('The pool is not loaded');
      if (!currentUserLock) throw new Error('Cannot find the current user, maybe wallet is disconnected');
      if (!readyToAddAmounts) throw new Error('');

      const amounts = readyToAddAmounts.map((ready) => {
        if (!ready) throw new Error('ready to amount cannot be empty');

        return {
          desired: ready.value.toString(),
          min: ready.newValue((val) => val.times(1 - slippage)).value.toString(),
        };
      });

      const [asset1] = poolInfo.assets;

      const tx = await api.generateAddLiquidityTransaction({
        poolId: poolInfo.poolId,
        lock: currentUserLock,
        assetsWithDesiredAmount: amounts.map((x, i) => createAssetWithBalance(poolInfo.assets[i], x.desired)),
        assetsWithMinAmount: amounts.map((x, i) => createAssetWithBalance(poolInfo.assets[i], x.min)),
        // TODO the current version tips is free, maybe changed next version
        tips: createAssetWithBalance(asset1, '0'),
      });

      setReadyToAddLiquidityTransaction(tx);
      return tx;
    },
    [api, currentUserLock, poolInfo, readyToAddAmounts, slippage],
  );

  async function sendReadyToAddLiquidityTransaction(): Promise<string> {
    if (!readyToAddLiquidityTransaction) throw new Error('Cannot find the ready to add liquidity transaction');
    const adapter = assertsConnectedAdapter();
    const txHash = await adapter.signer.sendTransaction(
      TransactionHelper.deserializeTransactionToSign(readyToAddLiquidityTransaction.transactionToSign),
    );

    await queryClient.refetchQueries('getLiquidityOperationSummaries');
    setReadyToAddLiquidityTransaction(undefined);
    return txHash;
  }

  return {
    generateAddLiquidityTransaction,
    userFreeBalances: userFreeBalances,
    onUserInputReadyToAddAmount,
    readyToAddShare,
    readyToAddAmounts,
    readyToAddLiquidityTransaction,
    sendReadyToAddLiquidityTransaction,
    readyToReceiveLPAmount,
  };
}
