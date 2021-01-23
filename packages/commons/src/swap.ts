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
    status: 'pending' | 'completed' | 'canceling';
    steps: SwapStep[];
  };
  type: SwapOrderType;
}
