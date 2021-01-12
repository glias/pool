/// <reference types="@nervosnetwork/ckb-types" />
declare namespace API {
  type U64 = string;

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
}
