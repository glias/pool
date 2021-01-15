import { Transaction } from '@lay2/pw-core';

declare namespace Server {
  export type U64 = string;
  export type U128 = string;

  export interface Token {
    amount: U128;
    typeHash: string;
    typeScript: Script;
  }

  export interface AddLiquidityRequest {
    tokenADesiredAmount: Token;
    tokenAMinAmount: Token;
    tokenBDesiredAmount: Token;
    tokenBMinAmount: Token;
    poolId: string;
    userLockScript: Script;
  }

  export interface TransactionWithFee {
    pwTransaction: Transaction;
    fee: U64;
  }

  export interface Script {
    codeHash: string;
    hashType: string;
    args: string;
  }
}
