import { TransactionHelper } from '@gliaswap/commons';
import { useGliaswap } from 'hooks/useGliaswap';
import { useQueryClient } from 'react-query';

export function useCancelLiquidityOperation() {
  const { api, currentUserLock, adapter } = useGliaswap();
  const queryClient = useQueryClient();

  async function cancelLiquidityOperation(txHash: string) {
    if (!currentUserLock) throw new Error('Cannot find current user lock, maybe wallet is disconnected');
    const { transactionToSign } = await api.generateCancelLiquidityRequestTransaction({
      txHash,
      lock: currentUserLock,
    });
    await adapter.signer.sendTransaction(TransactionHelper.deserializeTransactionToSign(transactionToSign));
    await queryClient.refetchQueries('getLiquidityOperationSummaries');
  }

  return { cancelLiquidityOperation };
}
