import { Token, TokenHolderFactory } from '../tokens';
import * as utils from '../../utils';
import { Cell } from '../cell';
import { CellInfoSerializationHolderFactory } from '../datas';

export class PoolInfoFactory {
  private static quoteBaseHolder: QuoteBaseHolder;

  static getQuoteBase(quoteBaseHash: string): QuoteBase {
    if (!PoolInfoFactory.quoteBaseHolder) {
      const builder: PoolInfoBuilder = new PoolInfoBuilder();
      PoolInfoFactory.quoteBaseHolder = new QuoteBaseHolder(builder.build());
    }
    return PoolInfoFactory.quoteBaseHolder.getQuoteBase(quoteBaseHash);
  }

  static getQuoteBaseByCell(cell: Cell): QuoteBase {
    const argsData = CellInfoSerializationHolderFactory.getInstance()
      .getInfoCellSerialization()
      .decodeArgs(cell.cellOutput.lock.args);
    return PoolInfoFactory.getQuoteBase(argsData.hash);
  }
}

class PoolInfoBuilder {
  build(): Map<string, QuoteBase> {
    const quoteBaseMap: Map<string, QuoteBase> = new Map();

    const tokens = TokenHolderFactory.getInstance().getTokens();
    let quoteToken;
    tokens.forEach((x) => {
      quoteToken = this.getTypeHash(x);
      tokens.forEach((y) => {
        const baseToken = this.getTypeHash(y);
        if (quoteToken === baseToken) {
          return;
        }

        const key1 = `0x${utils.blake2b([quoteToken, baseToken]).slice(2, 66)}`;
        const key2 = `0x${utils.blake2b([baseToken, quoteToken]).slice(2, 66)}`;

        quoteBaseMap.set(key1, new QuoteBase(x, y));
        quoteBaseMap.set(key2, new QuoteBase(y, x));
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
  constructor(private _quoteToken: Token, private _baseToken: Token) {}

  get quoteToken(): Token {
    return this._quoteToken;
  }

  get baseToken(): Token {
    return this._baseToken;
  }
}
