import { Asset } from './assets';

type Amounted = { amount: string };

type LiquidityAsset = Asset & Amounted;

export interface LiquidityPool {
  poolId: string;
  assets: LiquidityAsset[];
}
