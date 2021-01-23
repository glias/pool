import { createFixedStruct, U8, U128LE } from 'easy-byte';
import { SudtCellSerialization, LiquidityCellSerialization, LiquidityOrderCellArgs } from '.';

export class DefaultLiquidityCellSerialization implements LiquidityCellSerialization {
  constructor(private serialization: SudtCellSerialization) {
    this.serialization = serialization;
  }

  encodeArgs(userlockHash: string, version: number, amount0: bigint, amount1: bigint, infoTypeHash: string): string {
    const data = this.getStructDefine();

    return `${userlockHash}${data
      .encode({
        version,
        amount0,
        amount1,
      })
      .toString('hex')}${infoTypeHash.slice(2, 42)}`;
  }

  decodeArgs(argsHex: string): LiquidityOrderCellArgs {
    const args = this.getStructDefine();
    const decodeLenght = 66 + 2 + 32 + 32;
    const structObj = args.decode(Buffer.from(argsHex.slice(66, decodeLenght), 'hex'));
    const liquidityOrderCellData: LiquidityOrderCellArgs = {
      ...structObj,
      userLockHash: argsHex.slice(0, 66),
      infoTypeHash: `0x${argsHex.slice(decodeLenght, argsHex.length)}`,
    };
    return liquidityOrderCellData;
  }

  encodeData(sudtAmount: bigint): string {
    return this.serialization.encodeData(sudtAmount);
  }

  decodeData(dataHex: string): bigint {
    return this.serialization.decodeData(dataHex);
  }

  private getStructDefine() {
    return createFixedStruct().field('version', U8).field('amount0', U128LE).field('amount1', U128LE);
  }
}
