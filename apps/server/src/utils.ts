import * as commons from '@gliaswap/commons';
import { Server, Primitive } from '@gliaswap/types';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function serializeTransactionWithFee(txWithFee: Server.TransactionWithFee) {
  return {
    tx: commons.TransactionHelper.serializeTransaction(txWithFee.tx),
    fee: txWithFee.fee,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function serializeToken(token: Primitive.Token) {
  return {
    balance: token.balance,
    typeHash: token.typeHash,
    typeScript: token.typeScript ? commons.TransactionHelper.serializeScript(token.typeScript) : undefined,
    info: token.info,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function serializeCreateLiquidityPoolResponse(resp: Server.CreateLiquidityPoolResponse) {
  return {
    tx: commons.TransactionHelper.serializeTransaction(resp.tx),
    fee: resp.fee,
    lpToken: serializeToken(resp.lpToken),
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function deserializeToken(token: Primitive.Token) {
  return {
    balance: token.balance,
    typeHash: token.typeHash,
    typeScript: token.typeScript ? commons.TransactionHelper.deserializeScript(token.typeScript) : undefined,
    info: token.info,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function deserializeScript(script: Primitive.Script) {
  return commons.TransactionHelper.deserializeScript(script);
}
