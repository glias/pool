import { createFixedStruct, U128LE } from 'easy-byte';

export interface SudtAmountData {
  sudtAmount: bigint;
}
export class SudtAmountSerialization {
  static encodeData(sudtAmount: bigint): string {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    return `0x${data.encode({ sudtAmount: sudtAmount }).toString('hex')}`;
  }

  static decodeData(dataHex: string): bigint {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    const structObj = data.decode(Buffer.from(dataHex.slice(2, dataHex.length), 'hex'));
    return structObj.sudtAmount;
  }
}
