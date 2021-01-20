import { Primitive } from '.';

export interface CreateLiquidityPoolRequest {
  tokenA: Primitive.Token;
  tokenB: Primitive.Token;
  userLock: Primitive.Script;
}

export interface CreateLiquidityPoolResponse {
  tx: Primitive.Transaction;
  fee: Primitive.U64;
  lpToken: Primitive.Token;
}

export interface GenesisLiquidityRequest {
  tokenAAmount: Primitive.Token;
  tokenBAmount: Primitive.Token;
  poolId: Primitive.Hash;
  userLock: Primitive.Script;
}

export interface AddLiquidityRequest {
  tokenADesiredAmount: Primitive.Token;
  tokenAMinAmount: Primitive.Token;
  tokenBDesiredAmount: Primitive.Token;
  tokenBMinAmount: Primitive.Token;
  poolId: Primitive.Hash;
  userLock: Primitive.Script;
}

export interface RemoveLiquidityRequest {
  lpTokenAmount: Primitive.Token;
  tokenAMinAmount: Primitive.Token;
  tokenBMinAmount: Primitive.Token;
  poolId: Primitive.Hash;
  userLock: Primitive.Script;
}

export interface CancelOrderRequest {
  txHash: Primitive.Hash;
  userLock: Primitive.Script;
}

export interface SwapOrderRequest {
  tokenInAmount: Primitive.Token;
  tokenOutMinAmount: Primitive.Token;
  userLock: Primitive.Script;
}

export interface TransactionWithFee {
  tx: Primitive.Transaction;
  fee: Primitive.U64;
}

export interface OrderStage {
  step: string;
  message: string;
  data: string;
}

export interface OrdersRequest {
  lock: Primitive.Script;
  limit: number;
  skip: number;
}
