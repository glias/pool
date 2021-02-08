import { SerializedTransactionToSignWithFee, TransactionHelper } from '@gliaswap/commons';
import { useGliaswap } from 'hooks/useGliaswap';
import { useState } from 'react';
import { useQueryClient } from 'react-query';

interface UseCancelLiquidityOperationState {
  generateCancelLiquidityOperationTransaction: (txHash: string) => Promise<SerializedTransactionToSignWithFee>;
  sendCancelLiquidityOperationTransaction: () => Promise<string>;
  readyToSendTransaction: SerializedTransactionToSignWithFee | undefined;
  refreshReadyToSendTransaction: () => void;
}

export function useCancelLiquidityOperation(): UseCancelLiquidityOperationState {
  const { api, currentUserLock, assertsConnectedAdapter } = useGliaswap();
  const [readyToSendTransaction, setReadyToSendTransaction] = useState<
    SerializedTransactionToSignWithFee | undefined
  >();
  const queryClient = useQueryClient();

  async function generateLiquidityCancelOperationTransaction(txHash: string) {
    if (!currentUserLock) throw new Error('Cannot find current user lock, maybe wallet is disconnected');
    const transaction = await api.generateCancelLiquidityRequestTransaction({
      txHash,
      lock: currentUserLock,
    });
    setReadyToSendTransaction(transaction);
    return transaction;
  }

  async function sendCancelLiquidityOperationTransaction() {
    if (!readyToSendTransaction) throw new Error('The transaction was not fully generated, please try again');
    const adapter = assertsConnectedAdapter();
    const txHash = await adapter.signer.sendTransaction(
      TransactionHelper.deserializeTransactionToSign(readyToSendTransaction.transactionToSign),
    );
    await queryClient.refetchQueries('getLiquidityOperationSummaries');
    setReadyToSendTransaction(undefined);
    return txHash;
  }

  function refreshReadyToSendTransaction() {
    setReadyToSendTransaction(undefined);
  }

  return {
    sendCancelLiquidityOperationTransaction,
    generateCancelLiquidityOperationTransaction: generateLiquidityCancelOperationTransaction,
    readyToSendTransaction,
    refreshReadyToSendTransaction,
  };
}
