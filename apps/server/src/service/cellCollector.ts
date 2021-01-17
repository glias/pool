import { Primitive } from '@gliaswap/types';
import { Cell } from '@lay2/pw-core';

export class CellCollector {
  public static async collect(tokenAmount: Primitive.Token): Promise<Array<Cell>> {
    console.log(tokenAmount);

    const inputs = [];
    return inputs;
  }
}
