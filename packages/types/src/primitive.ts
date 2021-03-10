import * as PwCore from '@lay2/pw-core';

export type U64 = string;
export type U128 = string;
export type Hash = string;

export type Script = PwCore.Script;
export type Transaction = PwCore.Transaction;

export interface Token {
  balance: U128;
  typeHash: Hash;
  typeScript: Script;
  info: TokenInfo;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  logo_uri: string;
}
