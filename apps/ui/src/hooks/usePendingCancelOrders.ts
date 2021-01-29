import { SwapOrder } from '@gliaswap/commons';
import { useLocalStorage } from '@rehooks/local-storage';
import { useGliaswap } from 'hooks';
import { useCallback, useMemo } from 'react';

export type TxHash = string;

export type UsePendingCancelOrders = [TxHash[], (txHash: TxHash) => void, (txHashes: TxHash[]) => void];

export function usePendingCancelOrders(): UsePendingCancelOrders {
  const { currentUserLock } = useGliaswap();
  const namespace = `amm-pending-cancel-orders-/${currentUserLock?.args ?? 'defaults'}`;

  const [pendingCancelOrders, setPendingCancelOrders] = useLocalStorage<TxHash[]>(namespace, []);

  const addPendingCancelOrder = useCallback(
    (txHash: string) => {
      setPendingCancelOrders([...pendingCancelOrders, txHash]);
    },
    [pendingCancelOrders, setPendingCancelOrders],
  );

  return [pendingCancelOrders, addPendingCancelOrder, setPendingCancelOrders];
}

export function useSwapOrders(orders: SwapOrder[]) {
  const [pendingCancelOrders] = usePendingCancelOrders();
  return useMemo(() => {
    return orders.map((o) => {
      const pendingOrder = pendingCancelOrders.find((p) => p === o.transactionHash);
      if (pendingOrder) {
        return {
          ...o,
          stage: {
            ...o.stage,
            status: 'canceling',
            steps: [...o.stage.steps, { transactionHash: pendingOrder, index: '0x', errorMessage: '' }],
          },
        } as SwapOrder;
      }
      return o;
    });
  }, [orders, pendingCancelOrders]);
}
