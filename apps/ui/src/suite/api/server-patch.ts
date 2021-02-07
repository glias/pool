import {
  CkbAssetWithBalance,
  LiquidityOperationStage,
  LiquidityOperationSummary,
  LiquidityOperationType,
} from '@gliaswap/commons';
import { merge } from 'lodash';
import { createAssetWithBalance } from 'suite/asset';

export interface LiquidityOperationInfo {
  // total liquidity, maybe change next time, not sure
  total: string;
  transactionHash: string;
  timestamp: string;
  tokenA: TokenAOrTokenB;
  tokenB: TokenAOrTokenB;
  stage: Stage;
  type: string;
  poolId: string;
  lpToken: TokenAOrTokenB;
}

enum ORDER_STATUS {
  PENDING = 'pending',
  OPEN = 'open',
  COMPLETED = 'completed',
  CANCELING = 'canceling',
}

export interface TokenAOrTokenB {
  typeHash: string;
  typeScript: TypeScript;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  chainType: string;
  address: string;
  balance: string;
  shadowFrom: ShadowFrom;
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

export interface Stage {
  status: ORDER_STATUS;
  steps: StepsEntity[];
}

export interface StepsEntity {
  transactionHash: string;
  index: string;
  errorMessage: string;
}

export function transformLiquidityOperationInfo(data: LiquidityOperationInfo[]): LiquidityOperationSummary[] {
  return data.map<LiquidityOperationSummary>((info) => {
    const lpToken = merge(createAssetWithBalance({ chainType: 'Nervos', typeHash: '' }, info.total), info.lpToken);

    const steps = info.stage.steps.map((step) => ({ txHash: step.transactionHash }));

    return {
      poolId: info.poolId,
      model: 'UNISWAP',
      stage: { status: info.stage.status, steps } as LiquidityOperationStage,
      assets: [info.tokenA as CkbAssetWithBalance, info.tokenB as CkbAssetWithBalance],
      time: info.timestamp,
      txHash: info.transactionHash,
      type: info.type as LiquidityOperationType,
      // TODO replace with server lpToken when server fixed it
      lpToken,
    };
  });
}
