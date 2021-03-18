import { createFixedStruct, U8, U128LE } from 'easy-byte';
import { SudtCellSerialization, SwapCellSudtSudtSerialization, SwapOrderCellArgs, TipsArgsSerialization } from '.';

export class DefaultSwapCellSudtSudtSerialization implements SwapCellSudtSudtSerialization {
  constructor(private serialization: SudtCellSerialization, private tipsArgsSerialization: TipsArgsSerialization) {
    this.serialization = serialization;
    this.tipsArgsSerialization = tipsArgsSerialization;
  }

  encodeArgs = (
    sudtTypeHash: string,
    userlockHash: string,
    version: number,
    amountOutMin: bigint,
    tipsCkb: bigint,
    tipsSudt: bigint,
  ): string => {
    const data = this.getStructDefine();
    const tipsArgs = this.tipsArgsSerialization.encodeArgs(tipsCkb, tipsSudt);

    return `${sudtTypeHash}${userlockHash.slice(2)}${data
      .encode({
        version,
        amountOutMin,
      })
      .toString('hex')}${tipsArgs}`;
  };

  decodeArgs = (argsHex: string): SwapOrderCellArgs => {
    const args = this.getStructDefine();

    const dataLength = 66 + 64 + 2 + 32;

    const sudtTypeHash = argsHex.slice(0, 66);
    const userLockHash = `0x${argsHex.slice(66, 66 + 64)}`;
    const tipsData = this.tipsArgsSerialization.decodeSwapSudtSudtArgs(argsHex.slice(dataLength, argsHex.length));
    const tips = tipsData.tipsCkb;
    const tipsSudt = tipsData.tipsSudt;

    const structObj = args.decode(Buffer.from(argsHex.slice(130, dataLength), 'hex'));
    return {
      sudtTypeHash,
      userLockHash,
      ...structObj,
      tips,
      tipsSudt,
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
