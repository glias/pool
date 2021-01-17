import { Primitive } from '@gliaswap/types';
import { Cell, Script } from '@lay2/pw-core';

export interface TokenCellCollector {
  collect(tokenAmount: Primitive.Token, userLock: Script): Promise<Array<Cell>>;
}

export class DefaultTokenCellCollector implements TokenCellCollector {
  public async collect(tokenAmount: Primitive.Token, userLock: Script): Promise<Array<Cell>> {
    console.log(tokenAmount);
    console.log(userLock);

    const inputs = [];
    return inputs;
  }
}
