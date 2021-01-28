import {
  Asset,
  ChainSpec,
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  GenerateAddLiquidityTransactionPayload,
  getCkbChainSpec,
  GliaswapAPI,
  GliaswapAssetWithBalance,
  isCkbChainSpec,
  LiquidityInfo,
  LiquidityInfoFilter,
  LiquidityOrderSummary,
  LiquidityOrderSummaryFilter,
  LiquidityPoolFilter,
  Maybe,
  PoolInfo,
  Script,
  SerializedTransactionToSignWithFee,
  ShadowFromEthWithBalance,
} from '@gliaswap/commons';
import Axios, { AxiosInstance } from 'axios';
import { DummyGliaswapAPI } from 'suite/api/DummyGliaswapAPI';
import Web3 from 'web3';

const api = new DummyGliaswapAPI();

export class ServerGliaswapAPI implements GliaswapAPI {
  axios: AxiosInstance;

  web3: Web3 | undefined;

  constructor(/*private ethFetcher: EthAssetFetcher, serverUrl?: string*/) {
    this.axios = Axios.create({ baseURL: `${process.env.REACT_APP_SERVER_URL}/v1` });
  }

  setWeb3(web3: Web3) {
    this.web3 = web3;
  }

  async getAssetList(): Promise<Asset[]> {
    const res = await this.axios.post('/get-default-asset-list');
    return res.data;
  }

  cancelOperation(_txHash: string, _lock: Script): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  async generateAddLiquidityTransaction(
    payload: GenerateAddLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    const res = await this.axios.post<SerializedTransactionToSignWithFee>(
      '/liquidity-pool/orders/add-liquidity',
      payload,
    );

    return res.data;
  }

  generateRemoveLiquidityTransaction(): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  getAddLiquidityOrderSummaries(_filter: LiquidityOrderSummaryFilter): Promise<LiquidityOrderSummary[]> {
    return Promise.resolve([]);
  }

  async getAssetsWithBalance(lock: Script, assets?: ChainSpec[]): Promise<GliaswapAssetWithBalance[]> {
    if (!assets) {
      const res = await this.axios.post('/get-asset-with-balance', { lock });
      return res.data;
    }

    const nervosChainSpecs = assets.filter(isCkbChainSpec).map(getCkbChainSpec);
    const res = await this.axios.post<
      (CkbNativeAssetWithBalance | CkbSudtAssetWithBalance | ShadowFromEthWithBalance)[]
    >('/get-asset-with-balance', {
      lock,
      assets: nervosChainSpecs,
    });

    return res.data;
  }

  getDefaultAssetList(): Asset[] {
    return [];
  }

  getLiquidityInfo(_filter: LiquidityInfoFilter): Promise<Maybe<LiquidityInfo>> {
    return api.getLiquidityInfo();
  }

  async getLiquidityPools(filter: LiquidityPoolFilter | undefined): Promise<PoolInfo[]> {
    const res = await this.axios.post<PoolInfo[]>('/liquidity-pool', filter);
    return res.data;
  }

  getRemoveLiquidityOrderSummaries(_filter: LiquidityOrderSummaryFilter): Promise<LiquidityOrderSummary[]> {
    return Promise.resolve([]);
  }
}
