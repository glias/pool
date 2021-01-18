import { SudtAmountSerialization } from '.';

export class PoolCellInfoSerialization {
  static encodeData(sudtAmount: bigint): string {
    return SudtAmountSerialization.encodeData(sudtAmount);
  }

  static decodeData(dataHex: string): bigint {
    return SudtAmountSerialization.decodeData(dataHex);
  }
}
