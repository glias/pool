import { EthModel, SwapOrder, SwapOrderType } from '@gliaswap/commons';
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils';
import { crossChainOrdersCache } from 'cache';
import { useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { useMemo, useState } from 'react';
import { createContainer } from 'unstated-next';

const useCrossChainOrders = () => {
  const adapter = useWalletAdapter<Web3ModalAdapter>();
  const lockScript = useMemo(() => {
    if (adapter.status !== 'connected') return null;
    return addressToScript(adapter.signer.address);
  }, [adapter]);

  const [crossChainOrders, setCrossChainOrders] = useState<Array<SwapOrder>>(
    crossChainOrdersCache.get(lockScript?.args!),
  );

  const pendingEthTrasnactionDict = useMemo(() => {
    const dict: Record<string, bigint> = Object.create(null);
    for (const order of crossChainOrders) {
      const { type, amountIn, stage } = order;
      if (
        EthModel.isCurrentChainAsset(amountIn) &&
        (type === SwapOrderType.CrossChain || type === SwapOrderType.CrossChainOrder)
      ) {
        const { address, balance } = amountIn;
        const pendingBalance = dict[address] ?? BigInt(0);
        if (stage.steps.length <= 1) {
          dict[address] = pendingBalance + BigInt(balance);
        }
      }
    }

    return dict;
  }, [crossChainOrders]);

  return { crossChainOrders, setCrossChainOrders, pendingEthTrasnactionDict };
};

export const Container = createContainer(useCrossChainOrders);

export const useCrossChainOrdersContainer = Container.useContainer;

export const CrossChainOrderProvider = Container.Provider;
