import { createFixedStruct, U8, U128LE } from 'easy-byte';
import { SudtAmountSerialization } from '.';

export interface SwapOrderCellArgs {
  userLockHash: string;
  version: number;
  amountIn: bigint;
  minAmountOut: bigint;
  orderType: number;
}

export class SwapOrderCellInfoSerialization {
  static encodeArgs(
    userlockHash: string,
    version: number,
    amountIn: bigint,
    minAmountOut: bigint,
    orderType: number,
  ): string {
    const data = SwapOrderCellInfoSerialization.getStructDefine();

    return `${userlockHash}${data
      .encode({
        version: version,
        amountIn: amountIn,
        minAmountOut: minAmountOut,
        orderType: orderType,
      })
      .toString('hex')}`;
  }

  static decodeArgs(argsHex: string): SwapOrderCellArgs {
    const args = SwapOrderCellInfoSerialization.getStructDefine();
    const structObj = args.decode(Buffer.from(argsHex.slice(66, argsHex.length), 'hex'));
    const swapOrderCellData: SwapOrderCellArgs = {
      ...structObj,
      userLockHash: argsHex.slice(0, 66),
      orderType: structObj.orderType,
    };
    return swapOrderCellData;
  }

  static encodeData(sudtAmount: bigint): string {
    return SudtAmountSerialization.encodeData(sudtAmount);
  }

  static decodeData(dataHex: string): bigint {
    return SudtAmountSerialization.decodeData(dataHex);
  }

  private static getStructDefine() {
    return createFixedStruct()
      .field('version', U8)
      .field('amountIn', U128LE)
      .field('minAmountOut', U128LE)
      .field('orderType', U8);
  }
}
