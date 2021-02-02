import { createFixedStruct, U8, U128LE } from 'easy-byte';
import { SudtCellSerialization, SwapCellSerialization, SwapOrderCellArgs, TipsArgsSerialization } from '.';
import { TipsCellArgs } from '.';

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

    return `${sudtTypeHash}${data
      .encode({
        version,
        amountOutMin,
      })
      .toString('hex')}${userlockHash.slice(2)}${tipsArgs}`;
  };

  decodeArgs = (argsHex: string): SwapOrderCellArgs => {
    const args = this.getStructDefine();

    const dataLength = 66 + 2 + 32;

    const sudtTypeHash = argsHex.slice(0, 66);
    const userLockHash = `0x${argsHex.slice(dataLength, dataLength + 64)}`;
    const tips: TipsCellArgs = this.tipsArgsSerialization.decodeArgs(argsHex.slice(dataLength + 64, argsHex.length));

    const structObj = args.decode(Buffer.from(argsHex.slice(66, dataLength), 'hex'));
    return {
      userLockHash,
      ...structObj,
      sudtTypeHash,
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
