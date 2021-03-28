import { HashType } from '@ckb-lumos/base';
import dotenv from 'dotenv';
import { Cell, Script, Token } from '..';

import { INFO_LOCK_CODE_HASH, INFO_LOCK_HASH_TYPE, INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE } from '../../config';
dotenv.config();

export class PoolInfo {
  // INFO CELL
  static TYPE_CODE_HASH = INFO_TYPE_CODE_HASH;
  static TYPE_HASH_TYPE: HashType = INFO_TYPE_HASH_TYPE;

  static LOCK_CODE_HASH = INFO_LOCK_CODE_HASH;
  static LOCK_HASH_TYPE: HashType = INFO_LOCK_HASH_TYPE;

  static TYPE_ARGS: Record<string, string> = {
    GLIA: '0x0000000000000000000000000000000000000000000000000000000000000016',
    ckETH: '0x0000000000000000000000000000000000000000000000000000000000000012',
    ckDAI: '0x0000000000000000000000000000000000000000000000000000000000000013',
    ckUSDC: '0x0000000000000000000000000000000000000000000000000000000000000014',
    ckUSDT: '0x0000000000000000000000000000000000000000000000000000000000000015',
    PenPen: '0x0000000000000000000000000000000000000000000000000000000000000019',
  };

  static TYPE_SCRIPTS: Record<string, Script> = {
    GLIA: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['GLIA']),
    ckETH: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckETH']),
    ckDAI: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckDAI']),
    ckUSDC: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckUSDC']),
    ckUSDT: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckUSDT']),
    PenPen: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['PenPen']),
  };

  poolId: string;
  total: string;
  tokenA: Token;
  tokenB: Token;
  infoCell: Cell;
  lpToken?: Token;
  status: string;

  constructor(
    poolId: string,
    total: string,
    tokenA: Token,
    tokenB: Token,
    infoCell: Cell,
    lpToken?: Token,
    status = 'completed',
  ) {
    this.poolId = poolId;
    this.total = total;
    this.tokenA = tokenA;
    this.tokenB = tokenB;
    this.lpToken = lpToken;
    this.infoCell = infoCell;
    this.status = status;
  }

  static getTypeScripts(): Script[] {
    return [
      PoolInfo.TYPE_SCRIPTS['GLIA'],
      PoolInfo.TYPE_SCRIPTS['ckETH'],
      PoolInfo.TYPE_SCRIPTS['ckDAI'],
      PoolInfo.TYPE_SCRIPTS['ckUSDC'],
      PoolInfo.TYPE_SCRIPTS['ckUSDT'],
    ];
  }

  // static getTypeScriptByPoolId(poolId: string): Script {
  //   return PoolInfo.getTypeScripts().find((x) => x.toHash() === poolId);
  // }
}

export class PoolInfoHolder {
  constructor(private poolInfos: PoolInfo[]) {}

  getPoolInfos(): PoolInfo[] {
    return this.poolInfos;
  }
}
