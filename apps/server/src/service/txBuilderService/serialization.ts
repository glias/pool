import { createFixedStruct, U8, U128LE, U64LE } from 'easy-byte';

import * as utils from '../../utils';

export class TokenTokenRequestCellSerializationHolder {
  public getInfoCellSerialization(): InfoCellSerialization {
    return new InfoCellSerialization();
  }

  public getSudtCellSerialization(): SudtCellSerialization {
    return new SudtCellSerialization();
  }

  public getLiquidityCellSerialization(): LiquidityCellSerialization {
    return new LiquidityCellSerialization();
  }

  public getSwapCellSerialization(): SwapCellSerialization {
    return new SwapCellSerialization();
  }
}

export class SudtCellSerialization {
  encodeData = (sudtAmount: bigint): string => {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    return `0x${data.encode({ sudtAmount }).toString('hex')}`;
  };

  decodeData = (dataHex: string): bigint => {
    const data = createFixedStruct().field('sudtAmount', U128LE);
    const structObj = data.decode(Buffer.from(dataHex.slice(2, dataHex.length), 'hex'));
    return structObj.sudtAmount;
  };
}

export interface InfoCellData {
  tokenXReserve: bigint;
  tokenYReserve: bigint;
  totalLiquidity: bigint;
  tokenLPTypeHash: string;
}

export class InfoCellSerialization {
  encodeData = (
    tokenXReserve: bigint,
    tokenYReserve: bigint,
    totalLiquidity: bigint,
    tokenLPTypeHash: string,
  ): string => {
    const data = this.getStructDefine();

    return `0x${data
      .encode({
        tokenXReserve,
        tokenYReserve,
        totalLiquidity,
      })
      .toString('hex')}${tokenLPTypeHash.slice(2, 66)}`;
  };

  decodeData = (dataHex: string): InfoCellData => {
    const data = this.getStructDefine();
    const structObj = data.decode(Buffer.from(dataHex.slice(2, 98), 'hex'));

    const infoCellData: InfoCellData = {
      ...structObj,
      tokenLPTypeHash: `0x${dataHex.slice(98, dataHex.length)}`,
    };

    return infoCellData;
  };

  private getStructDefine() {
    return createFixedStruct()
      .field('tokenXReserve', U128LE)
      .field('tokenYReserve', U128LE)
      .field('totalLiquidity', U128LE);
  }
}

export interface LiquidityMainCellArgs {
  infoTypeHash: string;
  userLockHash: string;
  version: number;
  tokenXMin: bigint;
  tokenYMin: bigint;
  tipsCkb: bigint;
  tipsTokenX: bigint;
  tipsTokenY: bigint;
}

export interface LiquidityFellowCellArgs {
  infoTypeHash: string;
  userLockHash: string;
  version: number;
  mainCellLockHash: string;
}

export class LiquidityCellSerialization {
  encodeMainArgs = (
    infoTypeHash: string,
    userLockHash: string,
    version: number,
    tokenXMin: bigint,
    tokenYMin: bigint,
    tipsCkb: bigint,
    tipsTokenX: bigint,
    tipsTokenY: bigint,
  ): string => {
    const tailArgs = this.getTailArgsDefine()
      .encode({
        version,
        tokenXMin,
        tokenYMin,
        tipsCkb,
        tipsTokenX,
        tipsTokenY,
      })
      .toString('hex');

    return `0x${utils.trim0x(infoTypeHash)}${utils.trim0x(userLockHash)}${tailArgs}`;
  };

  decodeMainArgs = (argsHex: string): LiquidityMainCellArgs => {
    const infoTypeHash = argsHex.slice(0, 66);
    const userLockHash = `0x${argsHex.slice(66, 130)}`;
    const tailArgs = this.getTailArgsDefine().decode(Buffer.from(argsHex.slice(130), 'hex'));

    return {
      infoTypeHash,
      userLockHash,
      ...tailArgs,
    };
  };

  encodeFellowArgs = (
    infoTypeHash: string,
    userLockHash: string,
    version: number,
    mainCellLockHash: string,
  ): string => {
    const ver = createFixedStruct().field('version', U8);
    return `0x
      ${utils.trim0x(infoTypeHash)}
      ${utils.trim0x(userLockHash)}
      ${ver.encode({ version }).toString('hex')}
      ${utils.trim0x(mainCellLockHash)}`;
  };

  decodeFellowArgs = (argsHex: string): LiquidityFellowCellArgs => {
    const ver = createFixedStruct().field('version', U8);

    return {
      infoTypeHash: argsHex.slice(0, 66),
      userLockHash: `0x${argsHex.slice(66, 130)}`,
      ...ver.decode(Buffer.from(argsHex.slice(130, 132), 'hex')),
      mainCellLockHash: argsHex.slice(132, 196),
    };
  };

  private getTailArgsDefine() {
    return createFixedStruct()
      .field('version', U8)
      .field('tokenXMin', U128LE)
      .field('tokenYMin', U128LE)
      .field('tipsCkb', U64LE)
      .field('tipsTokenX', U128LE)
      .field('tipsTokenY', U128LE);
  }
}

export interface SwapCellArgs {
  tokenTypeHash: string;
  userLockHash: string;
  version: number;
  amountOutMin: bigint;
  tipsCkb: bigint;
  tipsToken: bigint;
}

export class SwapCellSerialization {
  encodeArgs = (
    tokenTypeHash: string,
    userLockHash: string,
    version: number,
    amountOutMin: bigint,
    tipsCkb: bigint,
    tipsToken: bigint,
  ): string => {
    const tailArgs = this.getTailArgsDefine()
      .encode({
        version,
        amountOutMin,
        tipsCkb,
        tipsToken,
      })
      .toString('hex');

    return `0x${utils.trim0x(tokenTypeHash)}${utils.trim0x(userLockHash)}${tailArgs}`;
  };

  public decodeArgs(argsHex: string): SwapCellArgs {
    return {
      tokenTypeHash: argsHex.slice(0, 66),
      userLockHash: `0x${argsHex.slice(66, 130)}`,
      ...this.getTailArgsDefine().decode(Buffer.from(argsHex.slice(130), 'hex')),
    };
  }

  private getTailArgsDefine() {
    return createFixedStruct()
      .field('version', U8)
      .field('amountOutMin', U128LE)
      .field('tipsCkb', U64LE)
      .field('tipsToken', U128LE);
  }
}
