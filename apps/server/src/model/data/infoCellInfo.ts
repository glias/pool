import { createFixedStruct, U128LE } from 'easy-byte';

export interface InfoCellArgs {
  hash: string;
  infoTypeHash: string;
}

export interface InfoCellData {
  ckbReserve: bigint;
  sudtReserve: bigint;
  totalLiquidity: bigint;
  liquiditySudtTypeHash20: string;
}

export class InfoCellInfoSerialization {
  static encodeArgs(hash: string, infoTypeHash: string): string {
    return `${hash.slice(0, 42)}${infoTypeHash.slice(2, 42)}`;
  }

  static decodeArgs(argsHex: string): InfoCellArgs {
    const infoCellData: InfoCellArgs = {
      hash: argsHex.slice(0, 42),
      infoTypeHash: `0x${argsHex.slice(42, argsHex.length)}`,
    };
    return infoCellData;
  }

  static encodeData(
    ckbReserve: bigint,
    sudtReserve: bigint,
    totalLiquidity: bigint,
    liquiditySudtTypeHash20: string,
  ): string {
    const data = InfoCellInfoSerialization.getStructDefine();
    return `0x${data
      .encode({
        ckbReserve,
        sudtReserve,
        totalLiquidity,
      })
      .toString('hex')}${liquiditySudtTypeHash20.slice(2, 42)}`;
  }

  static decodeData(dataHex: string): InfoCellData {
    const data = InfoCellInfoSerialization.getStructDefine();
    const structObj = data.decode(Buffer.from(dataHex.slice(2, 98), 'hex'));

    const infoCellData: InfoCellData = {
      ...structObj,
      liquiditySudtTypeHash20: `0x${dataHex.slice(98, dataHex.length)}`,
    };

    return infoCellData;
  }

  private static getStructDefine() {
    return createFixedStruct().field('ckbReserve', U128LE).field('sudtReserve', U128LE).field('totalLiquidity', U128LE);
  }
}
