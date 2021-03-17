import { createFixedStruct, U64LE, U128LE } from 'easy-byte';
import { TipsLiquidityCellSudtSudtArgs, TipsSwapCellSudtSudtArgs } from './cellDataInfoSerialization';
import { TipsArgsSerialization, TipsCellArgs } from '.';

export class DefaultTipsArgsSerialization implements TipsArgsSerialization {
  encodeSwapSudtSudtArgs(tipsCkb: bigint, tipsSudt: bigint): string {
    const data = this.getSwapSudtSudtStructDefine();
    return `${data.encode({ tipsCkb, tipsSudt }).toString('hex')}`;
  }
  decodeSwapSudtSudtArgs(argsHex: string): TipsSwapCellSudtSudtArgs {
    const args = this.getSwapSudtSudtStructDefine();
    return args.decode(Buffer.from(argsHex, 'hex'));
  }

  encodeLiquiditySudtSudtArgs(tipsCkb: bigint, tipsSudtX: bigint, tipsSudty: bigint): string {
    const data = this.getLiquiditySudtSudtStructDefine();
    return `${data.encode({ tipsCkb, tipsSudtX, tipsSudty }).toString('hex')}`;
  }

  decodeLiquiditySudtSudtArgs(argsHex: string): TipsLiquidityCellSudtSudtArgs {
    const args = this.getLiquiditySudtSudtStructDefine();
    return args.decode(Buffer.from(argsHex, 'hex'));
  }

  encodeArgs = (tips: bigint, tipsSudt: bigint): string => {
    const data = this.getStructDefine();

    return `${data.encode({ tips, tipsSudt }).toString('hex')}`;
  };

  decodeArgs = (argsHex: string): TipsCellArgs => {
    const args = this.getStructDefine();
    return args.decode(Buffer.from(argsHex, 'hex'));
  };

  private getStructDefine() {
    return createFixedStruct().field('tips', U64LE).field('tipsSudt', U128LE);
  }

  private getLiquiditySudtSudtStructDefine() {
    return createFixedStruct().field('tipsCkb', U64LE).field('tipsSudtX', U128LE).field('tipsSudty', U128LE);
  }

  private getSwapSudtSudtStructDefine() {
    return createFixedStruct().field('tipsCkb', U64LE).field('tipsSudt', U128LE);
  }
}
