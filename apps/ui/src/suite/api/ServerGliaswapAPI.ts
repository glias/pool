import {
  Asset,
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  EthErc20Asset,
  EthNativeAssetWithBalance,
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
  ShadowOfEthWithBalance,
  SwapOrder,
  EthErc20AssetWithBalance,
  isEthNativeAsset,
  isEthErc20Asset,
  EthAsset,
} from '@gliaswap/commons';
import Axios, { AxiosInstance } from 'axios';
import { DummyGliaswapAPI } from 'suite/api/DummyGliaswapAPI';
import Web3 from 'web3';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { CKB_NATIVE_TYPE_HASH, CKB_NODE_URL } from 'suite/constants';
import { Transaction } from '@lay2/pw-core';

const api = new DummyGliaswapAPI();

export class ServerGliaswapAPI implements GliaswapAPI {
  axios: AxiosInstance;

  ckb = new CKB(CKB_NODE_URL);

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

  async getAssetsWithBalance(
    lock: Script,
    assets?: Asset[],
    ethAddr?: string,
    web3?: Web3,
  ): Promise<GliaswapAssetWithBalance[]> {
    if (!assets) {
      const res = await this.axios.post('/get-asset-with-balance', { lock });
      return res.data;
    }

    // @ts-ignore
    const nervosChainSpecs = assets.filter(isCkbChainSpec).map(getCkbChainSpec);
    const ckbAssets = await this.axios.post<
      (CkbNativeAssetWithBalance | CkbSudtAssetWithBalance | ShadowOfEthWithBalance)[]
    >('/get-asset-with-balance', {
      lock,
      assets: nervosChainSpecs,
    });

    const ethAsset: EthAsset = assets.find(isEthNativeAsset)!;
    const erc20Assets: EthErc20Asset[] = assets.filter(isEthErc20Asset);
    try {
      const ethAssets = await Promise.all([
        this.getEthBalance(web3!, ethAddr!, ethAsset),
        ...erc20Assets.map((a) => this.getErc20Balance(web3!, ethAddr!, a)),
      ]);
      return [...ckbAssets.data, ...ethAssets] as GliaswapAssetWithBalance[];
    } catch (error) {
      throw new Error(error);
    }
  }

  async getEthBalance(web3: Web3, ethAddr: string, asset: Asset) {
    const balance = await web3.eth.getBalance(ethAddr);
    return {
      ...asset,
      balance,
    } as EthNativeAssetWithBalance;
  }

  async getErc20Balance(web3: Web3, ethAddr: string, asset: EthErc20Asset) {
    const contract = new web3.eth.Contract(
      [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
      ],
      asset.address,
    );
    const balance = await contract.methods.balanceOf(ethAddr).call();
    return {
      ...asset,
      balance,
    } as EthErc20AssetWithBalance;
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

  async getSwapOrders(lock: Script, ethAddress: string): Promise<SwapOrder[]> {
    const res = await this.axios.post('/swap/orders', {
      lock,
      ethAddress,
      limit: 0,
      skip: 0,
    });

    return res.data;
  }

  async cancelSwapOrders(txHash: string, lock: Script): Promise<{ tx: Transaction }> {
    const { data } = await this.axios.post('/swap/orders/cancel', {
      txHash,
      lock,
    });

    return data;
  }

  async swapNormalOrder(
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: Script,
  ): Promise<{ tx: Transaction }> {
    const { data } = await this.axios.post('/swap/orders/swap', {
      assetInWithAmount: tokenA,
      assetOutWithMinAmount: tokenB,
      lock,
      tip: {
        typeHash: CKB_NATIVE_TYPE_HASH,
        chainType: 'Nervos',
        decimals: 8,
        logoURI: 'http://121.196.29.165:3040/token/ckb.svg',
        name: 'CKB',
        balance: '0',
        locked: '0',
        occupied: '0',
        symbol: 'CKB',
      },
    });
    return data;
  }
}
