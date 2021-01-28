import { createFixedStruct, U64LE, U128LE } from 'easy-byte';
import { TipsArgsSerialization, TipsCellArgs } from '.';

export class DefaultTipsArgsSerialization implements TipsArgsSerialization {
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
}
