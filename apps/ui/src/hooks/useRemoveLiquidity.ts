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
import { useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Amount, BN, createAssetWithBalance, createNervosAssetPlaceholder } from 'suite';

interface Derived {
  readyToRemoveShare: number;
  readyToReceiveAssets: CkbAssetWithBalance[];
  readyToRemoveLpToken: CkbAssetWithBalance;
}

interface UseRemoveLiquidityState extends Derived {
  generateRemoveLiquidityTransaction: () => Promise<SerializedTransactionToSignWithFee>;
  setReadyToRemoveShare: (share: number) => void;
  // a number between (0,1]
  readyToSendTransactionWithFee: Maybe<SerializedTransactionToSignWithFee>;
  sendRemoveLiquidityTransaction: () => Promise<string>;
}

interface ReadyToRemoveLiquidity {
  share: number;
  receivedAssetsAmount: Amount[];
  removedLPAmount: Amount;
}

export function useRemoveLiquidity(poolId?: string): UseRemoveLiquidityState {
  const { userLiquidityQuery } = useLiquidityQuery(poolId);
  const { api, currentUserLock, assertsConnectedAdapter } = useGliaswap();
  const [{ slippage }] = useGlobalSetting();
  const queryClient = useQueryClient();

  // const [readyToRemoveShare, setReadyToRemoveShare] = useState(0);
  const [readyToRemove, setReadyToRemove] = useState<ReadyToRemoveLiquidity | null>();
  const [readyToSendTransactionWithFee, setReadyToSendTransactionWithFee] = useState<
    SerializedTransactionToSignWithFee | undefined
  >();

  function setReadyToRemoveShare(share: number) {
    if (!userLiquidityQuery.data) throw new Error('The pool info is not loaded');
    const { lpToken, assets: poolAssets } = userLiquidityQuery.data;

    const lpTokenReserve = Amount.fromAsset(lpToken);
    const removedLPAmount = lpTokenReserve.newValue((val) => val.times(share));

    const receivedAssetsAmount = poolAssets.map((poolAsset) =>
      Amount.fromAsset(poolAsset).newValue((poolReserve) =>
        price.getRemoveLiquidityReceiveAssetAmount(removedLPAmount.value, poolReserve, lpTokenReserve.value),
      ),
    );

    setReadyToRemove({ share, removedLPAmount, receivedAssetsAmount });
    // when the share ready to be removed changes,
    // the transactions ready to be sent before that time shall also expire
    setReadyToSendTransactionWithFee(undefined);
  }

  const { readyToRemoveShare, readyToReceiveAssets, readyToRemoveLpToken } = useMemo<Derived>(() => {
    if (!userLiquidityQuery.data) {
      return { readyToRemoveShare: 0, readyToReceiveAssets: [], readyToRemoveLpToken: createNervosAssetPlaceholder() };
    }

    const poolAssets = userLiquidityQuery.data.assets;
    const poolLpToken = userLiquidityQuery.data.lpToken;

    if (!readyToRemove) {
      return {
        readyToRemoveShare: 0,
        readyToReceiveAssets: poolAssets.map((poolAsset) => createAssetWithBalance(poolAsset, 0)),
        readyToRemoveLpToken: createAssetWithBalance(poolLpToken, 0),
      };
    }

    return {
      readyToRemoveShare: readyToRemove.share,
      readyToReceiveAssets: readyToRemove.receivedAssetsAmount.map((amount, i) =>
        createAssetWithBalance(poolAssets[i], amount),
      ),
      readyToRemoveLpToken: createAssetWithBalance(poolLpToken, readyToRemove.removedLPAmount),
    };
  }, [readyToRemove, userLiquidityQuery]);

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
    const adapter = assertsConnectedAdapter();
    const txHash = await adapter.signer.sendTransaction(
      TransactionHelper.deserializeTransactionToSign(readyToSendTransactionWithFee.transactionToSign),
    );

    await queryClient.refetchQueries('getLiquidityOperationSummaries');
    setReadyToRemove(null);

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
