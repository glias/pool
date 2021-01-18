import { Primitive } from '.';

export interface CreateLiquidityPoolRequest {
  tokenA: Primitive.Token;
  tokenB: Primitive.Token;
  userLock: Primitive.Script;
}

export interface CreateLiquidityPoolResponse {
  pwTransaction: Primitive.Transaction;
  fee: Primitive.U64;
  liquidityTokenTypeScript: Primitive.Script;
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
  liquidityTokenAmount: Primitive.Token;
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
  pwTransaction: Primitive.Transaction;
  fee: Primitive.U64;
}

export interface OrderStage {
  step: string;
  message: string;
  data: string;
}
