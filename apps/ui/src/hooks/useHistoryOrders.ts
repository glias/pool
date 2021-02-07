import { SwapOrder } from '@gliaswap/commons';
import { groupBy } from 'lodash';
import { useMemo } from 'react';

export function useHistoryOrders(orders: Array<SwapOrder>) {
  return useMemo(() => {
    const { completed: historyOrders = [], rest: pendingOrders = [] } = groupBy(orders, (o) =>
      o.stage.status === 'completed' ? 'completed' : 'rest',
    );

    return {
      historyOrders,
      pendingOrders,
    };
  }, [orders]);
}
