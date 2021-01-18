import { TokenHolder } from './token';
import fs from 'fs';
import * as path from 'path';

export class TokenTokenHolderFactory {
  private static instace: TokenHolder;
  static getInstance(): TokenHolder {
    if (!this.instace) {
      const data = fs.readFileSync(path.resolve(__dirname, '../../../token_list.json/'), 'utf-8');
      this.instace = new TokenHolder(JSON.parse(data));
    }
    return this.instace;
  }
}
