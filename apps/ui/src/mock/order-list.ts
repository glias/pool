import { SwapOrder, SwapOrderType } from '@gliaswap/commons';

export const swapIrders: SwapOrder[] = [
  {
    transactionHash: '123',
    timestamp: '1611394969541',
    amountIn: {
      chainType: 'Ethereum',
      name: 'ETH',
      decimals: 18,
      symbol: 'ETH',
      balance: '',
      address: '1234578901234578900',
    },
    amountOut: {
      chainType: 'Nervos',
      name: 'ckETH',
      decimals: 18,
      symbol: 'ckETH',
      typeHash: '',
      balance: '1234578901234578900',
      locked: '',
    },
    stage: {
      status: 'pending',
      steps: [
        {
          transactionHash: '1611394969541',
          index: '',
          errorMessage: '',
        },
      ],
    },
    type: SwapOrderType.CrossChain,
  },
];
