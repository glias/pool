import { JsonScript, Script } from './script';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
}

export interface JsonToken {
  typeHash: string;
  typeScript?: JsonScript | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;
}

export class Token {
  typeHash: string;
  typeScript?: Script | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;

  constructor(typeHash: string, balance: string, typeScript?: Script, info?: TokenInfo) {
    this.typeHash = typeHash;
    this.typeScript = typeScript;
    this.info = info;
    this.balance = balance;
  }

  static fromJson(jsonToken: JsonToken): Token {
    return new Token(jsonToken.typeHash, jsonToken.balance, Script.fromJson(jsonToken.typeScript), jsonToken.info);
  }

  toJson(): JsonToken {
    return {
      ...this,
    };
  }
}
