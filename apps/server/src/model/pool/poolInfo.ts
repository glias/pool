import { Cell, Script } from '..';
import { Token } from '..';
import { HashType } from '@ckb-lumos/base';
import dotenv from 'dotenv';
dotenv.config();

export class PoolInfo {
  // INFO CELL
  static TYPE_CODE_HASH =
    process.env.INFO_TYPE_CODE_HASH || '0xb31869abb8b9f2f62bbb89ad89e525fa39b54ee57383a53949a89d80fc468929';
  static TYPE_HASH_TYPE = process.env.INFO_TYPE_HASH_TYPE || 'data';

  static LOCK_CODE_HASH =
    process.env.INFO_LOCK_CODE_HASH || '0x74f5bee3f3ebc5ff31dbeb4da1b37099dfde61fe5f251375fe3ca9618542cca2';
  static LOCK_HASH_TYPE: HashType = <HashType>process.env.INFO_LOCK_HASH_TYPE || 'data';

  static TYPE_ARGS: Record<string, string> = {
    GLIA: '0x0000000000000000000000000000000000000000000000000000000000000016',
    ckETH: '0x0000000000000000000000000000000000000000000000000000000000000012',
    ckDAI: '0x0000000000000000000000000000000000000000000000000000000000000013',
    ckUSDC: '0x0000000000000000000000000000000000000000000000000000000000000014',
    ckUSDT: '0x0000000000000000000000000000000000000000000000000000000000000015',
  };

  static TYPE_SCRIPTS: Record<string, Script> = {
    GLIA: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['GLIA']),
    ckETH: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckETH']),
    ckDAI: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckDAI']),
    ckUSDC: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckUSDC']),
    ckUSDT: new Script(PoolInfo.TYPE_CODE_HASH, PoolInfo.TYPE_HASH_TYPE, PoolInfo.TYPE_ARGS['ckUSDT']),
  };

  poolId: string;
  total: string;
  tokenA: Token;
  tokenB: Token;
  infoCell: Cell;
  lpToken?: Token;

  constructor(poolId: string, total: string, tokenA: Token, tokenB: Token, infoCell: Cell, lpToken?: Token) {
    this.poolId = poolId;
    this.total = total;
    this.tokenA = tokenA;
    this.tokenB = tokenB;
    this.lpToken = lpToken;
    this.infoCell = infoCell;
  }

  static getTypeScript(): Script[] {
    return [
      PoolInfo.TYPE_SCRIPTS['GLIA'],
      PoolInfo.TYPE_SCRIPTS['ckETH'],
      PoolInfo.TYPE_SCRIPTS['ckDAI'],
      PoolInfo.TYPE_SCRIPTS['ckUSDC'],
      PoolInfo.TYPE_SCRIPTS['ckUSDT'],
    ];
  }

  static getSudtSymbol(poolCell: Cell): string {
    if (PoolInfo.TYPE_ARGS['GLIA'] === poolCell.cellOutput.type.args) {
      return 'GLIA';
    }

    if (PoolInfo.TYPE_ARGS['ckETH'] === poolCell.cellOutput.type.args) {
      return 'ckETH';
    }

    if (PoolInfo.TYPE_ARGS['ckDAI'] === poolCell.cellOutput.type.args) {
      return 'ckDAI';
    }

    if (PoolInfo.TYPE_ARGS['ckUSDC'] === poolCell.cellOutput.type.args) {
      return 'ckUSDC';
    }

    if (PoolInfo.TYPE_ARGS['ckUSDT'] === poolCell.cellOutput.type.args) {
      return 'ckUSDT';
    }
  }
}

export class PoolInfoHolder {
  constructor(private poolInfos: PoolInfo[]) {}

  getPoolInfos(): PoolInfo[] {
    return this.poolInfos;
  }
}
