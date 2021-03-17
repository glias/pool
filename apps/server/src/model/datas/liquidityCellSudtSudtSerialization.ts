import { createFixedStruct, U8, U128LE } from 'easy-byte';
import {
  SudtCellSerialization,
  TipsArgsSerialization,
  LiquidityCellSudtSudtSerialization,
  LiquidityOrderCellSudtSudtArgs,
} from '.';

export class DefaultLiquidityCellSudtSudtSerialization implements LiquidityCellSudtSudtSerialization {
  constructor(private serialization: SudtCellSerialization, private tipsArgsSerialization: TipsArgsSerialization) {
    this.serialization = serialization;
    this.tipsArgsSerialization = tipsArgsSerialization;
  }

  encodeArgs = (
    infoTypeHash: string,
    userlockHash: string,
    version: number,
    sudtXMin: bigint,
    sudtYMin: bigint,
    tipsCkb: bigint,
    tipsSudtX: bigint,
    tipsSudtY: bigint,
  ): string => {
    const data = this.getStructDefine();

    const tipsArgs = this.tipsArgsSerialization.encodeLiquiditySudtSudtArgs(tipsCkb, tipsSudtX, tipsSudtY);
    return `${infoTypeHash}${userlockHash.slice(2, 66)}${data
      .encode({
        version,
        sudtXMin,
        sudtYMin,
      })
      .toString('hex')}${tipsArgs}`;
  };

  decodeArgs = (argsHex: string): LiquidityOrderCellSudtSudtArgs => {
    const args = this.getStructDefine();
    const decodeStructObjLenght = 2 + 32 + 32;

    const infoTypeHash = argsHex.slice(0, 66);
    const userLockHash = `0x${argsHex.slice(66, 66 + 64)}`;
    const structObj = args.decode(Buffer.from(argsHex.slice(130, 130 + decodeStructObjLenght), 'hex'));

    const tips = this.tipsArgsSerialization.decodeLiquiditySudtSudtArgs(
      argsHex.slice(130 + decodeStructObjLenght, argsHex.length),
    );

    return {
      infoTypeHash,
      userLockHash,
      ...structObj,
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
    return createFixedStruct().field('version', U8).field('sudtXMin', U128LE).field('sudtYMin', U128LE);
  }
}
