import { LiquidityOperationSummary, SwapOrder } from '@gliaswap/commons';
import { groupBy } from 'lodash';
import { useMemo } from 'react';

export function useHistoryOrders<T extends SwapOrder | LiquidityOperationSummary>(orders: Array<T>) {
  return useMemo(() => {
    const { completed: historyOrders = [], rest: pendingOrders = [] } = groupBy(orders, (o) =>
      o.stage.status === 'completed' || o.stage.status === 'canceled' ? 'completed' : 'rest',
    );

    return {
      historyOrders,
      pendingOrders,
    };
  }, [orders]);
}
