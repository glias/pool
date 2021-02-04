import {
  CkbAssetWithBalance,
  Maybe,
  price,
  SerializedTransactionToSignWithFee,
  TransactionHelper,
} from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { useGliaswap } from 'hooks/useGliaswap';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { useLiquidityQuery } from 'hooks/useLiquidityQuery';
import update from 'immutability-helper';
import { zip } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { BN, createAssetWithBalance } from 'suite';

interface UseRemoveLiquidityState {
  generateRemoveLiquidityTransaction: () => Promise<SerializedTransactionToSignWithFee>;
  setReadyToRemoveShare: (share: number) => void;
  // a number between (0,1]
  readyToRemoveShare: number;
  readyToSendTransactionWithFee: Maybe<SerializedTransactionToSignWithFee>;
  readyToReceiveAssets: CkbAssetWithBalance[];
  readyToRemoveLpToken: CkbAssetWithBalance;
  sendRemoveLiquidityTransaction: () => Promise<string>;
}

export function useRemoveLiquidity(poolId?: string): UseRemoveLiquidityState {
  const { poolLiquidityQuery, userLiquidityQuery } = useLiquidityQuery(poolId);
  const { api, currentUserLock, adapter } = useGliaswap();
  const [{ slippage }] = useGlobalSetting();
  const queryClient = useQueryClient();

  const [readyToRemoveShare, setReadyToRemoveShare] = useState(0);
  const [readyToSendTransactionWithFee, setReadyToSendTransactionWithFee] = useState<
    SerializedTransactionToSignWithFee | undefined
  >();

  const [readyToReceiveAssets, readyToRemoveLpToken] = useMemo<[CkbAssetWithBalance[], CkbAssetWithBalance]>(() => {
    if (!poolLiquidityQuery.data || !userLiquidityQuery.data) {
      const placeholder = createAssetWithBalance({
        name: 'unknown',
        chainType: 'Nervos',
        symbol: 'unknown',
        decimals: 0,
      }) as CkbAssetWithBalance;
      return [[] as CkbAssetWithBalance[], placeholder];
    }

    const readyToRemoveLpToken = update(userLiquidityQuery.data.lpToken, {
      balance: (balance) => {
        return BN(balance).times(readyToRemoveShare).decimalPlaces(0).toString();
      },
    });

    const readyToReceiveAssets = zip(poolLiquidityQuery.data.assets, userLiquidityQuery.data.assets).map(
      ([poolAsset, userAsset], i) => {
        return update(userAsset!, {
          balance: () => {
            if (!poolLiquidityQuery.data || !poolAsset) {
              throw new Error(`cannot find pool liquidity asset: assets[${i}]`);
            }

            return price
              .getRemoveLiquidityReceiveAssetAmount(
                BN(readyToRemoveLpToken.balance),
                BN(poolAsset.balance),
                BN(poolLiquidityQuery.data.lpToken.balance),
              )
              .toString();
          },
        });
      },
    );

    return [readyToReceiveAssets, readyToRemoveLpToken];
  }, [poolLiquidityQuery.data, readyToRemoveShare, userLiquidityQuery.data]);

  useEffect(() => {
    setReadyToSendTransactionWithFee(undefined);
  }, [readyToRemoveShare]);

  async function generateRemoveLiquidityTransaction() {
    if (!userLiquidityQuery.data) throw new Error('The user liquidity is not loaded');
    if (!currentUserLock) throw new Error('Cannot find the user lock, maybe the wallet is connected');

    const { poolId, assets } = userLiquidityQuery.data;

    const tx = await api.generateRemoveLiquidityTransaction({
      poolId,
      lpToken: readyToRemoveLpToken,
      lock: currentUserLock,
      tips: createAssetWithBalance(assets[0]),
      assetsWithMinAmount: readyToReceiveAssets.map((asset) =>
        update(asset, {
          balance: (balance) =>
            BN(balance)
              .times(1 - slippage)
              .decimalPlaces(0, BigNumber.ROUND_FLOOR)
              .toString(),
        }),
      ),
    });

    setReadyToSendTransactionWithFee(tx);
    return tx;
  }

  async function sendRemoveLiquidityTransaction(): Promise<string> {
    if (!readyToSendTransactionWithFee) throw new Error('The remove liquidity transaction is not ready');
    const txHash = await adapter.signer.sendTransaction(
      TransactionHelper.deserializeTransactionToSign(readyToSendTransactionWithFee.transactionToSign),
    );
    await queryClient.refetchQueries('getLiquidityOperationSummaries');
    return txHash;
  }

  return {
    generateRemoveLiquidityTransaction,
    setReadyToRemoveShare,
    readyToRemoveShare,
    readyToSendTransactionWithFee,
    readyToReceiveAssets,
    readyToRemoveLpToken,
    sendRemoveLiquidityTransaction,
  };
}
