/// <reference types="@nervosnetwork/ckb-types" />
/// <reference types="@lay2/pw-core" />
import { Script, Transaction } from '@lay2/pw-core';

declare namespace API {
  export type U64 = string;
  export type U128 = string;

  type Get<QS, Response> = QS extends null
    ? Response extends null
      ? // eslint-disable-next-line @typescript-eslint/ban-types
        {}
      : { response: Response }
    : { response: Response; queryString: QS };

  interface CkbBalance {
    /**
     * available capacity
     */
    free: U64;
    /**
     * the actual space occupied by the cell
     */
    occupied: U64;
    /**
     * the capacity locked in the liquid pool or swap lock
     */
    locked: U64;
  }

  interface GetCkbBalance extends Get<CKBComponents.Script, CkbBalance> {
    api: '/ckb-balance';
    method: 'GET';
    queryString: CKBComponents.Script;
    response: CkbBalance;
  }

  type ClientRequest<T> = T extends { queryString: infer QS; response: infer Res } ? (qs: QS) => Promise<Res> : never;

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
}
