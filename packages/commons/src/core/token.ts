import { HexString, IScript, Script } from './';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
}

export interface IToken {
  typeHash: HexString;
  typeScript?: IScript | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;
}

export class Token implements IToken {
  constructor(public typeHash: HexString, public balance: string, public typeScript?: Script, public info?: TokenInfo) {
    this.typeHash = typeHash;
    this.typeScript = typeScript;
    this.info = info;
    this.balance = balance;
  }

  static fromJson(jsonToken: IToken): Token {
    return new Token(jsonToken.typeHash, jsonToken.balance, Script.fromJson(jsonToken.typeScript), jsonToken.info);
  }

  toJson(): IToken {
    return {
      ...this,
    };
  }
}
