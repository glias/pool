import { createFixedStruct, U128LE } from 'easy-byte';
import * as utils from '../../utils';
import { InfoCellArgs, InfoCellData, InfoCellSerialization } from '.';

export class DefaultInfoCellSerialization implements InfoCellSerialization {
  encodeArgs = (sudtTypeHash: string, infoTypeHash: string): string => {
    return `0x${utils.blake2b(['ckb', sudtTypeHash]).slice(2, 66)}${infoTypeHash.slice(2, 66)}`;
  };

  decodeArgs = (argsHex: string): InfoCellArgs => {
    const infoCellData: InfoCellArgs = {
      hash: argsHex.slice(0, 66),
      infoTypeHash: `0x${argsHex.slice(66, argsHex.length)}`,
    };
    return infoCellData;
  };

  encodeData = (
    ckbReserve: bigint,
    sudtReserve: bigint,
    totalLiquidity: bigint,
    liquiditySudtTypeHash: string,
  ): string => {
    const data = this.getStructDefine();

    return `0x${data
      .encode({
        ckbReserve,
        sudtReserve,
        totalLiquidity,
      })
      .toString('hex')}${liquiditySudtTypeHash.slice(2, 66)}`;
  };

  decodeData = (dataHex: string): InfoCellData => {
    const data = this.getStructDefine();
    const structObj = data.decode(Buffer.from(dataHex.slice(2, 98), 'hex'));

    const infoCellData: InfoCellData = {
      ...structObj,
      liquiditySudtTypeHash: `0x${dataHex.slice(98, dataHex.length)}`,
    };

    return infoCellData;
  };

  private getStructDefine() {
    return createFixedStruct().field('ckbReserve', U128LE).field('sudtReserve', U128LE).field('totalLiquidity', U128LE);
  }
}
