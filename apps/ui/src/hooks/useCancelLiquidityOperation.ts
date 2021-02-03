import { SerializedTransactionToSignWithFee, TransactionHelper } from '@gliaswap/commons';
import { useGliaswap } from 'hooks/useGliaswap';
import { useState } from 'react';

interface UseCancelLiquidityOperationState {
  generateCancelLiquidityOperationTransaction: (txHash: string) => Promise<SerializedTransactionToSignWithFee>;
  sendCancelLiquidityOperationTransaction: () => Promise<string>;
  readyToSendTransaction: SerializedTransactionToSignWithFee | undefined;
}

export function useCancelLiquidityOperation(): UseCancelLiquidityOperationState {
  const { api, currentUserLock, adapter } = useGliaswap();
  const [readyToSendTransaction, setReadyToSendTransaction] = useState<
    SerializedTransactionToSignWithFee | undefined
  >();

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
    if (!readyToSendTransaction) throw new Error('Cannot find current user lock, maybe wallet is disconnected');
    const txHash = await adapter.signer.sendTransaction(
      TransactionHelper.deserializeTransactionToSign(readyToSendTransaction.transactionToSign),
    );
    setReadyToSendTransaction(undefined);
    return txHash;
  }

  return {
    sendCancelLiquidityOperationTransaction,
    generateCancelLiquidityOperationTransaction: generateLiquidityCancelOperationTransaction,
    readyToSendTransaction,
  };
}
