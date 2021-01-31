import { CkbAssetWithBalance, Maybe, SerializedTransactionToSignWithFee } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { useGliaswap } from 'hooks/useGliaswap';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { useLiquidityQuery } from 'hooks/useLiquidityQuery';
import update from 'immutability-helper';
import { useEffect, useMemo, useState } from 'react';
import { BalanceWithoutDecimal, BN, createAssetWithBalance } from 'suite';

function calcMinAmountWithSlippage(balance: string, slippage: number) {
  return BN(balance)
    .times(1 - slippage)
    .decimalPlaces(0, BigNumber.ROUND_FLOOR)
    .toString();
}

interface UseRemoveLiquidityState {
  generateRemoveLiquidityTransaction: () => Promise<SerializedTransactionToSignWithFee>;
  setReadyToRemoveShare: (share: number) => void;
  // a number between (0,1]
  readyToRemoveShare: number;
  readyToSendTransactionWithFee: Maybe<SerializedTransactionToSignWithFee>;
  readyToReceiveAssets: CkbAssetWithBalance[];
  readyToRemoveLpToken: CkbAssetWithBalance;
}

export function useRemoveLiquidity(poolId?: string): UseRemoveLiquidityState {
  const { poolLiquidityQuery, userLiquidityQuery } = useLiquidityQuery(poolId);
  const { api, currentUserLock } = useGliaswap();
  const [{ slippage }] = useGlobalSetting();

  const [readyToRemoveShare, setReadyToRemoveShare] = useState(0);
  const [readyToSendTransactionWithFee, setReadyToSendTransactionWithFee] = useState<
    SerializedTransactionToSignWithFee | undefined
  >();

  const [readyToReceiveAssets, readyToRemoveLpToken] = useMemo<[CkbAssetWithBalance[], CkbAssetWithBalance]>(() => {
    if (!poolLiquidityQuery.data) {
      const placeholder = createAssetWithBalance({
        name: 'unknown',
        chainType: 'Nervos',
        symbol: 'unknown',
        decimals: 0,
      }) as CkbAssetWithBalance;
      return [[] as CkbAssetWithBalance[], placeholder];
    }

    const assets = poolLiquidityQuery.data.assets;

    const readyToReceiveAssets = assets.map<CkbAssetWithBalance>((asset) =>
      update(asset, {
        balance: () => BalanceWithoutDecimal.fromAsset(asset).value.times(readyToRemoveShare).toString(),
      }),
    );

    const readyToRemoveLpToken = update(poolLiquidityQuery.data.lpToken, {
      balance: (balance) => BN(balance).times(readyToRemoveShare).toString(),
    });

    return [readyToReceiveAssets, readyToRemoveLpToken];
  }, [poolLiquidityQuery.data, readyToRemoveShare]);

  useEffect(() => {
    setReadyToSendTransactionWithFee(undefined);
  }, [readyToRemoveShare]);

  async function generateRemoveLiquidityTransaction() {
    if (!userLiquidityQuery.data) throw new Error('The user liquidity is not loaded');
    if (!currentUserLock) throw new Error('Cannot find the user lock, maybe the wallet is connected');

    const { lpToken, poolId, assets } = userLiquidityQuery.data;

    const tx = await api.generateRemoveLiquidityTransaction({
      poolId,
      lpToken: update(lpToken, {
        balance: (balance) => BN(balance).times(readyToRemoveShare).decimalPlaces(0).toString(),
      }),
      lock: currentUserLock,
      tips: createAssetWithBalance(assets[0]),
      assetsWithMinAmount: assets.map((asset) =>
        update(asset, { balance: (balance) => calcMinAmountWithSlippage(balance, slippage) }),
      ),
    });

    setReadyToSendTransactionWithFee(tx);
    return tx;
  }

  return {
    generateRemoveLiquidityTransaction,
    setReadyToRemoveShare,
    readyToRemoveShare,
    readyToSendTransactionWithFee,
    readyToReceiveAssets,
    readyToRemoveLpToken,
  };
}
