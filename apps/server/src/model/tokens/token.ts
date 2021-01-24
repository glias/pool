import { Script } from '..';
import { AssetSchema } from '../../controller/swaggerSchema';

export class Token {
  typeHash: string;
  typeScript?: Script;
  info?: TokenInfo;
  shadowFrom?: TokenInfo;
  balance?: string;

  constructor(typeHash: string, typeScript?: Script, info?: TokenInfo, shadowFrom?: TokenInfo, balance?: string) {
    this.typeHash = typeHash;
    this.typeScript = typeScript;
    this.info = info;
    this.shadowFrom = shadowFrom;
    this.balance = balance;
  }

  getBalance(): bigint {
    if (!this.balance) {
      return 0n;
    }

    return BigInt(this.balance);
  }

  serialize(): Record<string, unknown> {
    return {
      typeHash: this.typeHash,
      typeScript: {
        ...this.typeScript,
      },
      info: {
        ...this.info,
      },
      balance: this.balance,
    };
  }

  // FIXME: token info and balance deserialize
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  static deserialize(value: any): Token {
    if (!value.typeHash) {
      throw new Error('Token: typeHash not found');
    }

    if (value.typeScript) {
      const typeScript = Script.deserialize({
        ...value.typeScript,
      });
      return new Token(value.typeHash, typeScript, value.info, value.balance);
    }

    return new Token(value.typeHash);
  }

  toAsset(): AssetSchema {
    return new AssetSchema(
      this.typeHash,
      { ...this.typeScript },
      this.info.name,
      this.info.symbol,
      this.info.decimal,
      this.info.logoUri,
      this.info.chainType,
      this.balance,
      this.shadowFrom,
    );
  }
}

export class TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
  address: string;
  chainType: string;
  constructor(name: string, symbol: string, decimal: number, logoUri: string, address: string, chainType: string) {
    this.name = name;
    this.symbol = symbol;
    this.decimal = decimal;
    this.logoUri = logoUri;
    this.address = address;
    this.chainType = chainType;
  }
}

export class TokenHolder {
  constructor(private toknes: Token[]) {}

  getTokens(): Token[] {
    return this.toknes;
  }

  getTokenByTypeHash(typeHash: string): Token {
    const token = this.toknes.find((x) => x.typeHash === typeHash);
    if (!token) {
      return null;
    }

    return token;
  }

  getTokenBySymbol(symbol: string): Token {
    const token = this.toknes.find((x) => x.info.symbol === symbol);
    if (!token) {
      return null;
    }

    return token;
  }

  getTypeScripts(): Script[] {
    return this.toknes
      .filter((x) => x.typeScript !== undefined)
      .map((x) => new Script(x.typeScript.codeHash, x.typeScript.hashType, x.typeScript.args));
  }
}
