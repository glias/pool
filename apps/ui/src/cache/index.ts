import { SwapOrder } from '@gliaswap/commons';

const CROSS_CHAIN_ORDERS = 'ckb_cross_chain_orders';

export const crossChainOrdersCache = {
  get(address: string): SwapOrder[] {
    try {
      return JSON.parse(localStorage.getItem(`${CROSS_CHAIN_ORDERS}:${address}`)!) || [];
    } catch (err) {
      return [];
    }
  },
  set(address: string, orders: Array<SwapOrder>) {
    return localStorage.setItem(`${CROSS_CHAIN_ORDERS}:${address}`, JSON.stringify(orders));
  },
};
