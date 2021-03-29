import { createFixedStruct, U8, U128LE } from 'easy-byte';
import {
  SudtCellSerialization,
  SwapCellSerialization,
  SwapOrderCellArgs,
  TipsArgsSerialization,
  TipsCellArgs,
} from '.';

export class DefaultSwapCellSerialization implements SwapCellSerialization {
  constructor(private serialization: SudtCellSerialization, private tipsArgsSerialization: TipsArgsSerialization) {
    this.serialization = serialization;
    this.tipsArgsSerialization = tipsArgsSerialization;
  }

  encodeArgs = (
    userlockHash: string,
    version: number,
    amountOutMin: bigint,
    sudtTypeHash: string,
    tips: bigint,
    tipsSudt: bigint,
  ): string => {
    const data = this.getStructDefine();
    const tipsArgs = this.tipsArgsSerialization.encodeArgs(tips, tipsSudt);

    return `${sudtTypeHash}${userlockHash.slice(2)}${data
      .encode({
        version,
        amountOutMin,
      })
      .toString('hex')}${tipsArgs}`;
  };

  decodeArgs = (argsHex: string): SwapOrderCellArgs => {
    const args = this.getStructDefine();

    const dataLength = 66 + 64;
    const sudtTypeHash = argsHex.slice(0, 66);
    const userLockHash = `0x${argsHex.slice(66, dataLength)}`;
    const structObj = args.decode(Buffer.from(argsHex.slice(dataLength, dataLength + 34), 'hex'));
    const tips: TipsCellArgs = this.tipsArgsSerialization.decodeArgs(argsHex.slice(dataLength + 34, argsHex.length));

    return {
      sudtTypeHash,
      ...structObj,
      userLockHash,
      ...tips,
    };
  };

  encodeData = (sudtAmount: bigint): string => {
    return this.serialization.encodeData(sudtAmount);
  };

  decodeData = (dataHex: string): bigint => {
    return this.serialization.decodeData(dataHex);
  };

  private getStructDefine() {
    return createFixedStruct().field('version', U8).field('amountOutMin', U128LE);
  }
}
