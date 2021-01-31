import { CkbAssetWithBalance, LiquidityOperationType, LiquidityRequestSummary } from '@gliaswap/commons';
import { createAssetWithBalance } from 'suite/asset';

export interface LiquidityOperationInfo {
  transactionHash: string;
  timestamp: string;
  tokenA: TokenAOrTokenB;
  tokenB: TokenAOrTokenB;
  stage: Stage;
  type: string;
  poolId: string;
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

export function transformLiquidityOperationInfo(data: LiquidityOperationInfo[]): LiquidityRequestSummary[] {
  return data.map<LiquidityRequestSummary>((info) => ({
    poolId: info.poolId,
    model: 'UNISWAP',
    status:
      info.stage.status === ORDER_STATUS.PENDING
        ? 'pending'
        : info.stage.status === ORDER_STATUS.OPEN
        ? 'open'
        : 'canceling',
    assets: [info.tokenA as CkbAssetWithBalance, info.tokenB as CkbAssetWithBalance],
    time: info.timestamp,
    txHash: info.transactionHash,
    type: info.type as LiquidityOperationType,
    // TODO replace with server lpToken when server fixed it
    lpToken: createAssetWithBalance({ chainType: 'Nervos', typeHash: '' }),
  }));
}
