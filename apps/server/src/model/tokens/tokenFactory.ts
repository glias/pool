import fs from 'fs';
import * as path from 'path';
import { cellConver, Token, TokenHolder, TokenInfo } from '..';

export class TokenHolderFactory {
  private static instace: TokenHolder;
  static getInstance(): TokenHolder {
    if (!this.instace) {
      const erc20Index = TokenHolderFactory.readErc20TokenFile();
      const datas = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../token_list.json/'), 'utf-8'));
      const tokens: Token[] = [];
      for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        const typeScript = cellConver.converScript(data.typeScript);
        const info = new TokenInfo(
          data.info.name,
          data.info.symbol,
          data.info.decimals,
          data.info.logoURI,
          data.info.address,
          data.info.chainType,
        );

        const shadowFrom = erc20Index.get(data.shadowFromAddress);

        const token = new Token(data.typeHash, typeScript, info, shadowFrom, null);
        tokens.push(token);
      }

      // console.log(tokens);

      this.instace = new TokenHolder(tokens);
    }
    return this.instace;
  }

  static readErc20TokenFile(): Map<string, TokenInfo> {
    const datas = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../erc20_token_list.json'), 'utf-8'));
    const erc20Index = new Map<string, TokenInfo>();
    for (let i = 0; i < datas.length; i++) {
      const data = datas[i];
      const info = new TokenInfo(
        data.info.name,
        data.info.symbol,
        data.info.decimals,
        data.info.logoURI,
        data.info.address,
        data.info.chainType,
      );

      erc20Index.set(info.address, info);
    }

    return erc20Index;
  }
}
