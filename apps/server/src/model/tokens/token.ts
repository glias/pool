import { Script } from '..';

export class Token {
  typeHash: string;
  typeScript: Script;
  info: TokenInfo;
  balance?: string;
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
