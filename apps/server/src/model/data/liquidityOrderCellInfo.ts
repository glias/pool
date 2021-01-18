import { createFixedStruct, U8, U128LE } from 'easy-byte';
import { SudtAmountSerialization } from '.';

export interface LiquidityOrderCellArgs {
  userLockHash: string;
  version: number;
  amount0: bigint;
  amount1: bigint;
  infoTypeHash: string;
}

export class LiquidityOrderCellInfoSerialization {
  static encodeArgs(
    userlockHash: string,
    version: number,
    amount0: bigint,
    amount1: bigint,
    infoTypeHash: string,
  ): string {
    const data = LiquidityOrderCellInfoSerialization.getStructDefine();

    return `${userlockHash}${data
      .encode({
        version,
        amount0,
        amount1,
      })
      .toString('hex')}${infoTypeHash.slice(2, 42)}`;
  }

  static decodeArgs(argsHex: string): LiquidityOrderCellArgs {
    const args = LiquidityOrderCellInfoSerialization.getStructDefine();
    const decodeLenght = 66 + 2 + 32 + 32;
    const structObj = args.decode(Buffer.from(argsHex.slice(66, decodeLenght), 'hex'));
    const liquidityOrderCellData: LiquidityOrderCellArgs = {
      ...structObj,
      userLockHash: argsHex.slice(0, 66),
      infoTypeHash: `0x${argsHex.slice(decodeLenght, argsHex.length)}`,
    };
    return liquidityOrderCellData;
  }

  static encodeData(sudtAmount: bigint): string {
    return SudtAmountSerialization.encodeData(sudtAmount);
  }

  static decodeData(dataHex: string): bigint {
    return SudtAmountSerialization.decodeData(dataHex);
  }

  private static getStructDefine() {
    return createFixedStruct().field('version', U8).field('amount0', U128LE).field('amount1', U128LE);
  }
}
