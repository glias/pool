import { Primitive } from '@gliaswap/types';
import { Cell, Script } from '@lay2/pw-core';

export interface TokenCellCollectorService {
  collect(tokenAmount: Primitive.Token, userLock: Script): Promise<Array<Cell>>;
}

export class DefaultTokenCellCollectorService implements TokenCellCollector {
  public async collect(tokenAmount: Primitive.Token, userLock: Script): Promise<Array<Cell>> {
    console.log(tokenAmount);
    console.log(userLock);

    const inputs = [];
    return inputs;
  }
}
