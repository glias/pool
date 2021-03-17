import { DefaultInfoCellSerialization } from './infoCellSerialization';
import { DefaultLiquidityCellSerialization } from './liquidityCellSerialization';
import { DefaultLiquidityCellSudtSudtSerialization } from './liquidityCellSudtSudtSerialization';
import { DefaultPoolCellSerialization } from './poolCellSerialization';
import { DefaultSudtCellSerialization } from './sudtCellSerialization';
import { DefaultSwapCellSerialization } from './swapCellSerialization';
import { DefaultSwapCellSudtSudtSerialization } from './swapCellSudtSudtSerialization';
import { DefaultTipsArgsSerialization } from './tipsSerialization';

export interface CellInfoSerializationHolder {
  getTipsArgsSerialization(): TipsArgsSerialization;
  getLiquidityCellSerialization(): LiquidityCellSerialization;
  getLiquidityCellSudtSudtSerialization(): LiquidityCellSudtSudtSerialization;
  getSwapCellSerialization(): SwapCellSerialization;
  getSwapCellSudtSudtSerialization(): SwapCellSudtSudtSerialization;
  getInfoCellSerialization(): InfoCellSerialization;
  getPoolCellSerialization(): PoolCellSerialization;
  getSudtCellSerialization(): SudtCellSerialization;
}

export class DefaultCellInfoSerializationHolder implements CellInfoSerializationHolder {
  getTipsArgsSerialization(): TipsArgsSerialization {
    return new DefaultTipsArgsSerialization();
  }

  getLiquidityCellSerialization(): LiquidityCellSerialization {
    return new DefaultLiquidityCellSerialization(this.getSudtCellSerialization(), this.getTipsArgsSerialization());
  }

  getLiquidityCellSudtSudtSerialization(): LiquidityCellSudtSudtSerialization {
    return new DefaultLiquidityCellSudtSudtSerialization(
      this.getSudtCellSerialization(),
      this.getTipsArgsSerialization(),
    );
  }

  getSwapCellSerialization(): SwapCellSerialization {
    return new DefaultSwapCellSerialization(this.getSudtCellSerialization(), this.getTipsArgsSerialization());
  }
  getSwapCellSudtSudtSerialization(): SwapCellSudtSudtSerialization {
    return new DefaultSwapCellSudtSudtSerialization(this.getSudtCellSerialization(), this.getTipsArgsSerialization());
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

export interface TipsArgsSerialization {
  encodeArgs(tips: bigint, tipsSudt: bigint): string;
  decodeArgs(argsHex: string): TipsCellArgs;

  encodeLiquiditySudtSudtArgs(tipsCkb: bigint, tipsSudtX: bigint, tipsSudty: bigint): string;
  decodeLiquiditySudtSudtArgs(argsHex: string): TipsLiquidityCellSudtSudtArgs;

  encodeSwapSudtSudtArgs(tipsCkb: bigint, tipsSudt: bigint): string;
  decodeSwapSudtSudtArgs(argsHex: string): TipsSwapCellSudtSudtArgs;
}

export interface LiquidityCellSerialization {
  encodeArgs(
    userlockHash: string,
    version: number,
    sudtMin: bigint,
    ckbMin: bigint,
    infoTypeHash: string,
    tips: bigint,
    tipsSudt: bigint,
  ): string;
  decodeArgs(argsHex: string): LiquidityOrderCellArgs;
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}

export interface LiquidityCellSudtSudtSerialization {
  encodeArgs(
    infoTypeHash: string,
    userlockHash: string,
    version: number,
    sudtXMin: bigint,
    sudtYMin: bigint,
    tipsCkb: bigint,
    tipsSudtX: bigint,
    tipsSudtY: bigint,
  ): string;
  decodeArgs(argsHex: string): LiquidityOrderCellSudtSudtArgs;
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}
export interface SwapCellSerialization {
  encodeArgs(
    userlockHash: string,
    version: number,
    amountOutMin: bigint,
    sudtTypeHash: string,
    tips: bigint,
    tipsSudt: bigint,
  ): string;
  decodeArgs(argsHex: string): SwapOrderCellArgs;
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}

export interface SwapCellSudtSudtSerialization {
  encodeArgs(
    sudtTypeHash: string,
    userlockHash: string,
    version: number,
    amountOutMin: bigint,
    tipsCkb: bigint,
    tipsSudt: bigint,
  ): string;
  decodeArgs(argsHex: string): SwapOrderSudtSudtCellArgs;
  encodeData(sudtAmount: bigint): string;
  decodeData(dataHex: string): bigint;
}

export interface InfoCellSerialization {
  encodeArgs(hash: string, infoTypeHash: string): string;
  decodeArgs(argsHex: string): InfoCellArgs;
  encodeData(ckbReserve: bigint, sudtReserve: bigint, totalLiquidity: bigint, liquiditySudtTypeHash: string): string;
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
  sudtMin: bigint;
  ckbMin: bigint;
  infoTypeHash: string;
  tips: bigint;
  tipsSudt: bigint;
}

export interface LiquidityOrderCellSudtSudtArgs {
  infoTypeHash: string;
  userLockHash: string;
  version: number;
  sudtXMin: bigint;
  sudtYMin: bigint;
  tipsCkb: bigint;
  tipsSudtX: bigint;
  tipsSudty: bigint;
}

export interface SwapOrderCellArgs {
  userLockHash: string;
  version: number;
  amountOutMin: bigint;
  sudtTypeHash: string;
  tips: bigint;
  tipsSudt: bigint;
}

export interface SwapOrderSudtSudtCellArgs {
  sudtTypeHash: string;
  userLockHash: string;
  version: number;
  amountOutMin: bigint;
  tipsCkb: bigint;
  tipsSudt: bigint;
}

export interface InfoCellArgs {
  hash: string;
  infoTypeHash: string;
}

export interface InfoCellData {
  quoteReserve: bigint;
  baseReserve: bigint;
  totalLiquidity: bigint;
  liquiditySudtTypeHash: string;
}

export interface TipsCellArgs {
  tips: bigint;
  tipsSudt: bigint;
}

export interface TipsSwapCellSudtSudtArgs {
  tipsCkb: bigint;
  tipsSudt: bigint;
}

export interface TipsLiquidityCellSudtSudtArgs {
  tipsCkb: bigint;
  tipsSudtX: bigint;
  tipsSudty: bigint;
}
