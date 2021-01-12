import { API } from '@gliaswap/types';
import { Cell } from '@lay2/pw-core';

export class CellCollector {
  public static async collect(tokenAmount: API.Token): Promise<Array<Cell>> {
    console.log(tokenAmount);

    const inputs = [];
    return inputs;
  }
}
