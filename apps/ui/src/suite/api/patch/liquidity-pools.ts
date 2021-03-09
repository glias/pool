export interface LiquidityResponse {
  poolId: string;
  lpToken: LpToken;
  total: string;
  assets: AssetsEntity[];
  model: string;
}
export interface LpToken {
  typeHash: string;
  balance: string;
}
export interface AssetsEntity {
  typeHash: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  chainType: string;
  balance: string;
  typeScript?: TypeScript | null;
  address?: string | null;
  shadowFrom?: ShadowFrom | null;
}
export interface TypeScript {
  codeHash: string;
  hashType: string;
  args: string;
}
export interface ShadowFrom {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  address: string;
  chainType: string;
}
