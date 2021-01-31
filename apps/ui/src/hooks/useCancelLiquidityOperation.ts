import { TransactionHelper } from '@gliaswap/commons';
import { useGliaswap } from 'hooks/useGliaswap';

export function useCancelLiquidityOperation() {
  const { api, currentUserLock, adapter } = useGliaswap();

  async function cancelLiquidityOperation(txHash: string) {
    if (!currentUserLock) throw new Error('Cannot find current user lock, maybe wallet is disconnected');
    const { transactionToSign } = await api.generateCancelLiquidityRequestTransaction({
      txHash,
      lock: currentUserLock,
    });
    await adapter.signer.sendTransaction(TransactionHelper.deserializeTransactionToSign(transactionToSign));
  }

  return { cancelLiquidityOperation };
}
