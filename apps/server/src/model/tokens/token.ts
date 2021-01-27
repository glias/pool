import { Script } from '..';
import BigNumber from 'bignumber.js';
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

  toERC20Token(): Token {
    if (!this.shadowFrom) {
      return null;
    }

    return new Token(null, null, this.shadowFrom, null, null);
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
      return new Token(value.typeHash, typeScript, value.info, undefined, value.balance);
    }

    return new Token(value.typeHash, undefined, value.info, undefined, value.balance);
  }

  toAsset(): AssetSchema {
    return new AssetSchema(
      this.typeHash,
      this.typeScript ? { ...this.typeScript } : null,
      this.info.name,
      this.info.symbol,
      this.info.decimals,
      this.info.logoURI,
      this.info.chainType,
      this.info.address,
      new BigNumber(this.balance).toString(),
      this.shadowFrom,
    );
  }
}

export class TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  address: string;
  chainType: string;
  constructor(name: string, symbol: string, decimals: number, logoURI: string, address: string, chainType: string) {
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
    this.logoURI = logoURI;
    this.address = address;
    this.chainType = chainType;
  }
}

export class TokenHolder {
  constructor(private toknes: Token[]) {}

  getTokens(): Token[] {
    return this.toknes.map((x) => new Token(x.typeHash, x.typeScript, x.info, x.shadowFrom, null));
  }

  getTokenByTypeHash(typeHash: string): Token {
    const token = this.toknes.find((x) => x.typeHash === typeHash);
    if (!token) {
      return null;
    }

    return new Token(token.typeHash, token.typeScript, token.info, token.shadowFrom, null);
  }

  getTokenBySymbol(symbol: string): Token {
    const token = this.toknes.find((x) => x.info.symbol === symbol);
    if (!token) {
      return null;
    }

    return new Token(token.typeHash, token.typeScript, token.info, token.shadowFrom, null);
  }

  getTokenByShadowFromAddress(address: string): Token {
    const token = this.toknes.find((x) => x.shadowFrom && address.toLowerCase() === x.shadowFrom.address.toLowerCase());
    if (!token) {
      return null;
    }

    return new Token(token.typeHash, token.typeScript, token.info, token.shadowFrom, null);
  }

  getTypeScripts(): Script[] {
    return this.toknes
      .filter((x) => x.typeScript !== undefined)
      .map((x) => new Script(x.typeScript.codeHash, x.typeScript.hashType, x.typeScript.args));
  }
}
