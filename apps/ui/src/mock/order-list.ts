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
      balance: '1234578901234578900',
      address: '1234578901234578900',
      logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    },
    amountOut: {
      chainType: 'Nervos',
      name: 'ckETH',
      decimals: 18,
      symbol: 'ckETH',
      typeHash: '',
      balance: '1234578901234578900',
      locked: '',
      logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      shadowFrom: {
        chainType: 'Ethereum',
        name: 'ETH',
        decimals: 18,
        symbol: 'ETH',
        address: '1234578901234578900',
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
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
  {
    transactionHash: '123',
    timestamp: '1611394969541',
    amountIn: {
      chainType: 'Nervos',
      name: 'ckETH',
      decimals: 18,
      symbol: 'ckETH',
      typeHash: '',
      balance: '1234578901234578900',
      locked: '',
      logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      shadowFrom: {
        chainType: 'Ethereum',
        name: 'ETH',
        decimals: 18,
        symbol: 'ETH',
        address: '1234578901234578900',
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
    },
    amountOut: {
      chainType: 'Nervos',
      name: 'CKB',
      decimals: 8,
      symbol: 'CKB',
      typeHash: '',
      balance: '1234578901234578900',
      locked: '',
      logoURI: 'https://www.nervos.org/wp-content/uploads/2020/12/nervos-logo-white-700px.png',
    },
    stage: {
      status: 'completed',
      steps: [
        {
          transactionHash: '1611394969541',
          index: '',
          errorMessage: '',
        },
      ],
    },
    type: SwapOrderType.CrossChainOrder,
  },
];
