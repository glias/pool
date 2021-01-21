import { HexString, JsonScript, Script } from './';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
}

export interface JsonToken {
  typeHash: HexString;
  typeScript?: JsonScript | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;
}

export class Token {
  typeHash: HexString;
  typeScript?: Script | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;

  constructor(typeHash: HexString, balance: string, typeScript?: Script, info?: TokenInfo) {
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
