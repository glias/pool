import { createFixedStruct, U8, U128LE } from 'easy-byte';
import { SudtCellSerialization, SwapCellSerialization, SwapOrderCellArgs } from '.';

export class DefaultSwapCellSerialization implements SwapCellSerialization {
  constructor(private serialization: SudtCellSerialization) {
    this.serialization = serialization;
  }

  encodeArgs(userlockHash: string, version: number, amountIn: bigint, minAmountOut: bigint, orderType: number): string {
    const data = this.getStructDefine();

    return `${userlockHash}${data
      .encode({
        version: version,
        amountIn: amountIn,
        minAmountOut: minAmountOut,
        orderType: orderType,
      })
      .toString('hex')}`;
  }

  decodeArgs(argsHex: string): SwapOrderCellArgs {
    const args = this.getStructDefine();
    const structObj = args.decode(Buffer.from(argsHex.slice(66, argsHex.length), 'hex'));
    const swapOrderCellData: SwapOrderCellArgs = {
      ...structObj,
      userLockHash: argsHex.slice(0, 66),
      orderType: structObj.orderType,
    };
    return swapOrderCellData;
  }

  encodeData(sudtAmount: bigint): string {
    return this.serialization.encodeData(sudtAmount);
  }

  decodeData(dataHex: string): bigint {
    return this.serialization.decodeData(dataHex);
  }

  private getStructDefine() {
    return createFixedStruct()
      .field('version', U8)
      .field('amountIn', U128LE)
      .field('minAmountOut', U128LE)
      .field('orderType', U8);
  }
}
