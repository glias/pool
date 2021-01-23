import fs from 'fs';
import * as path from 'path';
import { cellConver, Token, TokenHolder } from '..';

export class TokenTokenHolderFactory {
  private static instace: TokenHolder;
  static getInstance(): TokenHolder {
    if (!this.instace) {
      const datas = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../token_list.json/'), 'utf-8'));
      const tokens: Token[] = [];
      for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        data.typeScript = cellConver.converScript(data.typeScript);
        tokens.push(data);
      }
      this.instace = new TokenHolder(tokens);
    }
    return this.instace;
  }
}
