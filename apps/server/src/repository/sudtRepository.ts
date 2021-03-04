import rp from 'request-promise';
import { Script, Token, TokenInfo } from '../model';
import { explorerConfig } from '../config';

export interface TokenRepository {
  getGroupByAddress(): Map<string, Token[]>;

  getGroupByTypeHash(): Map<string, Token>;
}

class CkbTokenRepository implements TokenRepository {
  constructor(
    private readonly groupByAddress: Map<string, Token[]> = new Map(),
    private readonly groupByTypeHash: Map<string, Token> = new Map(),
  ) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      console.log('sync explorer');

      const QueryOptions = {
        url: explorerConfig.explorerTokensUrl,
        method: 'GET',
        headers: {
          accept: 'application/vnd.api+json',
          // 'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'content-type': 'application/vnd.api+json',
        },
        referrer: explorerConfig.explorerCorsReferrer,
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: null,
        mode: 'cors',
      };
      const result = await rp(QueryOptions);
      const sudtinfos = JSON.parse(result).data;
      for (const sudtInfo of sudtinfos) {
        const tokenInfo: TokenInfo = new TokenInfo(
          sudtInfo.attributes.full_name,
          sudtInfo.attributes.symbol,
          sudtInfo.attributes.decimal,
          '',
          sudtInfo.attributes.issuer_address,
          'Nervos',
        );
        const token: Token = new Token(
          sudtInfo.attributes.type_hash,
          sudtInfo.type_script
            ? new Script(sudtInfo.type_script.code_hash, sudtInfo.type_script.hash_type, sudtInfo.type_script.args)
            : null,
          tokenInfo,
        );

        let tokens = this.getGroupByAddress().get(tokenInfo.address);
        if (!tokens) {
          tokens = [];
          this.groupByAddress.set(tokenInfo.address, tokens);
        }

        if (tokens.filter((x) => x.typeHash === token.typeHash).length === 0) {
          tokens.push(token);
        }

        this.groupByTypeHash.set(token.typeHash, token);
      }
    }, 60000);
  }

  getGroupByAddress(): Map<string, Token[]> {
    return this.groupByAddress;
  }

  getGroupByTypeHash(): Map<string, Token> {
    return this.groupByTypeHash;
  }
}

export const tokenRepository = new CkbTokenRepository();
