import { DefaultInfoCellSerialization } from './infoCellSerialization';
import { DefaultLiquidityCellSerialization } from './liquidityCellSerialization';
import { DefaultPoolCellSerialization } from './poolCellSerialization';
import { DefaultSudtCellSerialization } from './sudtCellSerialization';
import { DefaultSwapCellSerialization } from './swapCellSerialization';

export interface CellInfoSerializationHolder {
  getLiquidityCellSerialization(): LiquidityCellSerialization;
  getSwapCellSerialization(): SwapCellSerialization;
  getInfoCellSerialization(): InfoCellSerialization;
  getPoolCellSerialization(): PoolCellSerialization;
  getSudtCellSerialization(): SudtCellSerialization;
}

export class DefaultCellInfoSerializationHolder implements CellInfoSerializationHolder {
  getLiquidityCellSerialization(): LiquidityCellSerialization {
    return new DefaultLiquidityCellSerialization(this.getSudtCellSerialization());
  }
  getSwapCellSerialization(): SwapCellSerialization {
    return new DefaultSwapCellSerialization(this.getSudtCellSerialization());
  }
  getInfoCellSerialization(): InfoCellSerialization {
    return new DefaultInfoCellSerialization();
  }
  getPoolCellSerialization(): PoolCellSerialization {
    return new DefaultPoolCellSerialization(this.getSudtCellSerialization());
  }
  getSudtCellSerialization(): SudtCellSerialization {
    return new DefaultSudtCellSerialization();
  }
}

export class CellInfoSerializationHolderFactory {
  static getInstance(): CellInfoSerializationHolder {
    return new DefaultCellInfoSerializationHolder();
  }
}

export interface LiquidityCellSerialization {
  encodeArgs(userlockHash: string, version: number, amount0: bigint, amount1: bigint, infoTypeHash: string): string;
  decodeArgs(argsHex: string): LiquidityOrderCellArgs;
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}

export interface SwapCellSerialization {
  encodeArgs(userlockHash: string, version: number, amountIn: bigint, minAmountOut: bigint, orderType: number): string;
  decodeArgs(argsHex: string): SwapOrderCellArgs;
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}

export interface InfoCellSerialization {
  encodeArgs(hash: string, infoTypeHash: string): string;
  decodeArgs(argsHex: string): InfoCellArgs;
  encodeData(ckbReserve: bigint, sudtReserve: bigint, totalLiquidity: bigint, liquiditySudtTypeHash20: string): string;
  decodeData(dataHex: string): InfoCellData;
}

export interface PoolCellSerialization {
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}

export type SudtCellSerialization = PoolCellSerialization;

export interface LiquidityOrderCellArgs {
  userLockHash: string;
  version: number;
  amount0: bigint;
  amount1: bigint;
  infoTypeHash: string;
}

export interface SwapOrderCellArgs {
  userLockHash: string;
  version: number;
  amountIn: bigint;
  minAmountOut: bigint;
  orderType: number;
}

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
