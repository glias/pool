import * as commons from '@gliaswap/commons';
import { Server, Primitive } from '@gliaswap/types';

export function serializeTransactionWithFee(txWithFee: Server.TransactionWithFee) {
  return {
    transaction: commons.TransactionHelper.serializeTransaction(txWithFee.transaction),
    fee: txWithFee.fee,
  };
}

export function serializeCreateLiquidityPoolResponse(resp: Server.CreateLiquidityPoolResponse) {
  return {
    transaction: commons.TransactionHelper.serializeTransaction(resp.transaction),
    fee: resp.fee,
    lpTokenTypeScript: commons.TransactionHelper.serializeScript(resp.lpTokenTypeScript),
  };
}

export function deserializeToken(token: Primitive.Token) {
  return {
    balance: token.balance,
    typeHash: token.typeHash,
    typeScript: token.typeScript ? commons.TransactionHelper.deserializeScript(token.typeScript) : undefined,
    info: token.info,
  };
}

export function deserializeScript(script: Primitive.Script) {
  return commons.TransactionHelper.deserializeScript(script);
}
