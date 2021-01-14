import { Primitive } from '.';

export interface AddLiquidityRequest {
  tokenADesiredAmount: Primitive.Token;
  tokenAMinAmount: Primitive.Token;
  tokenBDesiredAmount: Primitive.Token;
  tokenBMinAmount: Primitive.Token;
  poolId: Primitive.Hash;
  userLockScript: Primitive.Script;
}

export interface RemoveLiquidityRequest {
  liquidityTokenAmount: Primitive.Token;
  tokenAMinAmount: Primitive.Token;
  tokenBMinAmount: Primitive.Token;
  poolId: Primitive.Hash;
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
