import { Script } from '..';

export class Token {
  typeHash: string;
  typeScript?: Script;
  info?: TokenInfo | null;
  balance?: string;

  constructor(typeHash: string, typeScript?: Script, info?: TokenInfo, balance?: string) {
    this.typeHash = typeHash;
    this.typeScript = typeScript;
    this.info = info;
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
}

export class TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
  issuerAddress: string;
  chainType: string;
}

export class TokenHolder {
  constructor(private toknes: Token[]) {}

  getTokens(): Token[] {
    return this.toknes.map((x) => {
      const token = { ...x };
      return token;
    });
  }

  getTokenByTypeHash(typeHash: string): Token {
    const token = this.toknes.find((x) => x.typeHash === typeHash);
    if (!token) {
      return null;
    }
    return { ...token };
  }

  getTokenBySymbol(symbol: string): Token {
    const token = this.toknes.find((x) => x.info.symbol === symbol);
    if (!token) {
      return null;
    }
    return { ...token };
  }

  getTypeScripts(): Script[] {
    return this.toknes
      .filter((x) => x.typeScript !== undefined)
      .map((x) => new Script(x.typeScript.codeHash, x.typeScript.hashType, x.typeScript.args));
  }
}
