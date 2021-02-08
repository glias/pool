import { GliaswapAssetWithBalance } from '@gliaswap/commons';

export enum SwapOrderType {
  CrossChain = 'CrossChain',
  CrossChainOrder = 'CrossChainOrder',
  Order = 'Order',
}

export interface SwapStep {
  transactionHash: string;
  index: string;
  errorMessage: string;
}

export interface SwapOrder {
  transactionHash: string;
  timestamp: string;
  amountIn: GliaswapAssetWithBalance;
  amountOut: GliaswapAssetWithBalance;
  stage: {
    status: 'pending' | 'completed' | 'canceling' | 'canceled';
    steps: SwapStep[];
  };
  type: SwapOrderType;
}

export function buildPendingSwapOrder(
  tokenA: GliaswapAssetWithBalance,
  tokenB: GliaswapAssetWithBalance,
  txHash: string,
  swapType: SwapOrderType,
): SwapOrder {
  return {
    timestamp: Date.now().toString(),
    transactionHash: txHash,
    amountIn: tokenA,
    amountOut: tokenB,
    stage: {
      status: 'pending',
      steps: [
        {
          transactionHash: txHash,
          index: '',
          errorMessage: '',
        },
      ],
    },
    type: swapType,
  };
}
