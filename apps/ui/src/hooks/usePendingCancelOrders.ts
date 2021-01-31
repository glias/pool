import { SwapOrder } from '@gliaswap/commons';
import { useLocalStorage } from '@rehooks/local-storage';
import BigNumber from 'bignumber.js';
import { useGliaswap } from 'hooks';
import { groupBy, values } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

export interface PendingCancelOrder {
  txHash: string;
  timestamp: string;
}

export type UsePendingCancelOrders = [
  PendingCancelOrder[],
  (txHash: string) => void,
  (txHashes: PendingCancelOrder[]) => void,
];

export function usePendingCancelOrders(): UsePendingCancelOrders {
  const { currentUserLock } = useGliaswap();
  const namespace = `amm-pending-cancel-orders-/${currentUserLock?.args ?? 'defaults'}`;

  const [pendingCancelOrders, setPendingCancelOrders] = useLocalStorage<PendingCancelOrder[]>(namespace, []);

  const addPendingCancelOrder = useCallback(
    (txHash: string) => {
      setPendingCancelOrders([...pendingCancelOrders, { timestamp: `${Date.now()}`, txHash }]);
    },
    [pendingCancelOrders, setPendingCancelOrders],
  );

  useEffect(() => {
    const halfHour = 30 * 60 * 1000;
    const interval = setInterval(() => {
      setPendingCancelOrders(
        pendingCancelOrders.filter((p) => {
          return new BigNumber(p.timestamp).plus(halfHour).isGreaterThan(Date.now());
        }),
      );
    }, 30e3);
    return () => clearInterval(interval);
  }, [pendingCancelOrders, setPendingCancelOrders]);

  return [pendingCancelOrders, addPendingCancelOrder, setPendingCancelOrders];
}

export function sortByTimestamp<T extends SwapOrder>(a: T, b: T): number {
  return new BigNumber(a.timestamp).isLessThan(b.timestamp) ? 1 : -1;
}

export function useSwapOrders(orders: SwapOrder[]) {
  const [pendingCancelOrders] = usePendingCancelOrders();
  return useMemo(() => {
    const res = orders.map((o) => {
      const pendingOrder = pendingCancelOrders.find(
        (p) => p.txHash === o.stage?.steps?.[0]?.transactionHash || p.txHash === o.transactionHash,
      );
      if (pendingOrder) {
        return {
          ...o,
          stage: {
            ...o.stage,
            status: 'canceling',
            steps: [...o.stage.steps, { transactionHash: pendingOrder.txHash, index: '0x', errorMessage: '' }],
          },
        } as SwapOrder;
      }
      return o;
    });
    const [pending, rest] = values(groupBy(res, (o) => (o.stage.status === 'pending' ? 'pending' : 'rest')));
    return pending.sort(sortByTimestamp).concat(rest.sort(sortByTimestamp));
  }, [orders, pendingCancelOrders]);
}
