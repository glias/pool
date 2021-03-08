import { CKB_TYPE_HASH } from '@gliaswap/constants';

import { Script, Token, TransactionToSign } from '../../model';

export interface CkbTokenRequest {
  isCkbTokenRequest(): boolean;
}

export class CreateLiquidityPoolRequest implements CkbTokenRequest {
  tokenA: Token;
  tokenB: Token;
  userLock: Script;

  constructor(tokenA: Token, tokenB: Token, userLock: Script) {
    this.tokenA = tokenA;
    this.tokenB = tokenB;
    this.userLock = userLock;
  }

  isCkbTokenRequest = (): boolean => {
    return this.tokenA.typeHash == CKB_TYPE_HASH || this.tokenB.typeHash == CKB_TYPE_HASH;
  };
}

export class CreateLiquidityPoolResponse {
  tx: TransactionToSign;
  fee: bigint;
  lpToken: Token;

  constructor(tx: TransactionToSign, fee: bigint, lpToken: Token) {
    this.tx = tx;
    this.fee = fee;
    this.lpToken = lpToken;
  }

  serialize(): Record<string, unknown> {
    return {
      tx: this.tx.serialize(),
      fee: this.fee.toString(),
      lpToken: this.lpToken.serialize(),
    };
  }
}

export class GenesisLiquidityRequest implements CkbTokenRequest {
  tokenAAmount: Token;
  tokenBAmount: Token;
  poolId: string;
  userLock: Script;
  tips: Token;

  constructor(tokenAAmount: Token, tokenBAmount: Token, poolId: string, userLock: Script, tips: Token) {
    this.tokenAAmount = tokenAAmount;
    this.tokenBAmount = tokenBAmount;
    this.poolId = poolId;
    this.userLock = userLock;
    this.tips = tips;
  }

  isCkbTokenRequest = (): boolean => {
    return this.tokenAAmount.typeHash == CKB_TYPE_HASH || this.tokenBAmount.typeHash == CKB_TYPE_HASH;
  };
}

export class AddLiquidityRequest implements CkbTokenRequest {
  tokenADesiredAmount: Token;
  tokenAMinAmount: Token;
  tokenBDesiredAmount: Token;
  tokenBMinAmount: Token;
  poolId: string;
  userLock: Script;
  tips: Token;

  constructor(
    tokenADesiredAmount: Token,
    tokenAMinAmount: Token,
    tokenBDesiredAmount: Token,
    tokenBMinAmount: Token,
    poolId: string,
    userLock: Script,
    tips: Token,
  ) {
    this.tokenADesiredAmount = tokenADesiredAmount;
    this.tokenAMinAmount = tokenAMinAmount;
    this.tokenBDesiredAmount = tokenBDesiredAmount;
    this.tokenBMinAmount = tokenBMinAmount;
    this.poolId = poolId;
    this.userLock = userLock;
    this.tips = tips;
  }

  isCkbTokenRequest = (): boolean => {
    return this.tokenADesiredAmount.typeHash == CKB_TYPE_HASH || this.tokenBDesiredAmount.typeHash == CKB_TYPE_HASH;
  };
}

export class RemoveLiquidityRequest implements CkbTokenRequest {
  lpTokenAmount: Token;
  tokenAMinAmount: Token;
  tokenBMinAmount: Token;
  poolId: string;
  userLock: Script;
  tips: Token;

  constructor(
    lpTokenAmount: Token,
    tokenAMinAmount: Token,
    tokenBMinAmount: Token,
    poolId: string,
    userLock: Script,
    tips: Token,
  ) {
    this.lpTokenAmount = lpTokenAmount;
    this.tokenAMinAmount = tokenAMinAmount;
    this.tokenBMinAmount = tokenBMinAmount;
    this.poolId = poolId;
    this.userLock = userLock;
    this.tips = tips;
  }

  isCkbTokenRequest = (): boolean => {
    return this.tokenAMinAmount.typeHash == CKB_TYPE_HASH || this.tokenBMinAmount.typeHash == CKB_TYPE_HASH;
  };
}

export class SwapRequest implements CkbTokenRequest {
  tokenInAmount: Token;
  tokenOutMinAmount: Token;
  userLock: Script;
  tips: Token;

  constructor(tokenInAmount: Token, tokenOutMinAmount: Token, userLock: Script, tips: Token) {
    this.tokenInAmount = tokenInAmount;
    this.tokenOutMinAmount = tokenOutMinAmount;
    this.userLock = userLock;
    this.tips = tips;
  }

  isCkbTokenRequest = (): boolean => {
    return this.tokenInAmount.typeHash == CKB_TYPE_HASH || this.tokenOutMinAmount.typeHash == CKB_TYPE_HASH;
  };
}

export const enum CancelRequestType {
  Liquidity,
  Swap,
}

export interface CancelRequest {
  txHash: string;
  userLock: Script;
  requestType: CancelRequestType;
}

export class TransactionWithFee {
  tx: TransactionToSign;
  fee: bigint;

  constructor(tx: TransactionToSign, fee: bigint) {
    this.tx = tx;
    this.fee = fee;
  }

  serialize(): Record<string, unknown> {
    return {
      tx: this.tx.serialize(),
      fee: this.fee.toString(),
    };
  }
}
