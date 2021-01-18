export interface OrderInfo {
  name: string,
  symbol: string,
  decimal: number,
  logoUri: string
}

export interface Script {
  codeHash: string,
  hashType: string,
  args: string
}

export interface Token {
  typeHash: string,
  typeScript: Script,
  info: OrderInfo,
  balance: string
}

export enum OrderType {
  CrossChain = 'CrossChain',
  CrossChainOrder = 'CrossChainOrder',
  Order = 'Order'
}

export interface Order {
  transactionHash: string,
  timestamp: string,
  amountIn: Token,
  amountOut: Token,
  stage: {
    status: 'pending' | 'completed' | 'canceling',
    steps: [{
      transactionHash: '',
      index: '',
      errorMessage: '',
    }]
  },
  type: OrderType
}
