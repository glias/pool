import { createFixedStruct, U128LE } from 'easy-byte';
import { SudtCellSerialization } from '.';

export class DefaultSudtCellSerialization implements SudtCellSerialization {
  encodeData(sudtAmount: bigint): string {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    return `0x${data.encode({ sudtAmount: sudtAmount }).toString('hex')}`;
  }

  decodeData(dataHex: string): bigint {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    const structObj = data.decode(Buffer.from(dataHex.slice(2, dataHex.length), 'hex'));
    return structObj.sudtAmount;
  }
}
