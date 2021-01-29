import { Cell } from '..';
import { Token } from '..';

export interface PoolInfo {
  poolId: string;
  lpToken?: Token;
  total: string;
  tokenA: Token;
  tokenB: Token;
  infoCell?: Cell;
}
