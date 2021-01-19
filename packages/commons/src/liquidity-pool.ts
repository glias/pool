import { Asset } from './assets';

type Amounted = { amount: string };

export type LiquidityAsset = Asset & Amounted;

export interface LiquidityPool {
  poolId: string;
  assets: LiquidityAsset[];
}
