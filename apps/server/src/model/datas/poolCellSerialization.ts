import { PoolCellSerialization, SudtCellSerialization } from '.';

export class DefaultPoolCellSerialization implements PoolCellSerialization {
  constructor(private serialization: SudtCellSerialization) {
    this.serialization = serialization;
  }
  encodeData(sudtAmount: bigint): string {
    return this.serialization.encodeData(sudtAmount);
  }

  decodeData(dataHex: string): bigint {
    return this.serialization.decodeData(dataHex);
  }
}
