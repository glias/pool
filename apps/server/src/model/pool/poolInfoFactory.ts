import { CKB_TOKEN_TYPE_HASH } from '../../config';
import * as utils from '../../utils';
import { Cell } from '../cell';
import { CellInfoSerializationHolderFactory } from '../datas';
import { Token, TokenHolderFactory } from '../tokens';

export class PoolInfoFactory {
  private static quoteBaseHolder: QuoteBaseHolder;

  static getTokens(quoteBaseHash: string): QuoteBase {
    if (!PoolInfoFactory.quoteBaseHolder) {
      const builder: PoolInfoBuilder = new PoolInfoBuilder();
      PoolInfoFactory.quoteBaseHolder = new QuoteBaseHolder(builder.build());
    }
    return PoolInfoFactory.quoteBaseHolder.getQuoteBase(quoteBaseHash);
  }

  static getTokensByCell(cell: Cell): QuoteBase {
    const argsData = CellInfoSerializationHolderFactory.getInstance()
      .getInfoCellSerialization()
      .decodeArgs(cell.cellOutput.lock.args);
    return PoolInfoFactory.getTokens(argsData.hash);
  }

  static sortTypeHash(tokenATypeHash: string, tokenBTypeHash: string): string[] {
    const typeHashes = [];
    typeHashes.push(tokenATypeHash);
    typeHashes.push(tokenBTypeHash);

    return typeHashes.sort();
  }
}

class PoolInfoBuilder {
  build(): Map<string, QuoteBase> {
    const quoteBaseMap: Map<string, QuoteBase> = new Map();

    const tokens = TokenHolderFactory.getInstance().getTokens();

    tokens.forEach((x) => {
      const quoteToken = this.getTypeHash(x);
      tokens.forEach((y) => {
        const baseToken = this.getTypeHash(y);
        if (quoteToken === baseToken) {
          return;
        }

        const typeHashes = PoolInfoFactory.sortTypeHash(x.typeHash, y.typeHash);
        const key1 = `0x${utils.blake2b([quoteToken, baseToken]).slice(2, 66)}`;
        const key2 = `0x${utils.blake2b([baseToken, quoteToken]).slice(2, 66)}`;

        const quoteBase = new QuoteBase(
          TokenHolderFactory.getInstance().getTokenByTypeHash(typeHashes[0]),
          TokenHolderFactory.getInstance().getTokenByTypeHash(typeHashes[1]),
        );

        quoteBaseMap.set(key1, quoteBase);
        quoteBaseMap.set(key2, quoteBase);
      });
    });

    return quoteBaseMap;
  }

  getTypeHash(token: Token): string {
    if (token.typeHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return 'ckb';
    }

    return token.typeHash;
  }
}

class QuoteBaseHolder {
  constructor(private quoteBaseMap: Map<string, QuoteBase>) {}

  getQuoteBase(quoteBaseHash: string): QuoteBase {
    return this.quoteBaseMap.get(quoteBaseHash);
  }
}

export class QuoteBase {
  constructor(private _tokenA: Token, private _tokenB: Token) {}

  isSudtSudt(): boolean {
    if (this.tokenA.typeHash === CKB_TOKEN_TYPE_HASH || this.tokenB.typeHash === CKB_TOKEN_TYPE_HASH) {
      return false;
    }

    return true;
  }

  get tokenA(): Token {
    return this._tokenA;
  }

  get tokenB(): Token {
    return this._tokenB;
  }
}
