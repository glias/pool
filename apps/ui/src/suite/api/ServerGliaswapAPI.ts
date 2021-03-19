import {
  Asset,
  CkbAsset,
  CkbAssetWithBalance,
  CkbModel,
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  EthAsset,
  EthErc20Asset,
  EthErc20AssetWithBalance,
  EthModel,
  EthNativeAssetWithBalance,
  GenerateAddLiquidityTransactionPayload,
  GenerateCancelRequestTransactionPayload,
  GenerateCreateLiquidityPoolTransactionPayload,
  GenerateCreateLiquidityPoolTransactionResponse,
  GenerateGenesisLiquidityTransactionPayload,
  GenerateRemoveLiquidityTransactionPayload,
  GenerateSwapTransactionPayload,
  GliaswapAPI,
  GliaswapAssetWithBalance,
  LiquidityInfo,
  LiquidityInfoFilter,
  LiquidityOperationSummary,
  LiquidityOperationSummaryFilter,
  LiquidityPoolFilter,
  Maybe,
  PoolInfoWithStatus,
  PoolInfoWithStatusFilter,
  PoolModel,
  Script as CkbScript,
  SerializedTransactionToSignWithFee,
  SerializedTransactonToSign,
  ShadowFromEthWithBalance,
  SwapOrder,
  TransactionHelper,
} from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { Modal } from 'antd';
import Axios, { AxiosError, AxiosInstance } from 'axios';
import update from 'immutability-helper';
import { isEmpty, merge } from 'lodash';
import * as ServerTypes from 'suite/api/server-patch';
import { BN, createAssetWithBalance } from 'suite/asset';
import { CKB_NATIVE_TYPE_HASH, CKB_NODE_URL } from 'suite/constants';
import Web3 from 'web3';
import { INFO_ABI } from './abi';
import { LiquidityResponse } from './patch/liquidity-pools';

export class ServerGliaswapAPI implements GliaswapAPI {
  axios: AxiosInstance;

  ckb = new CKB(CKB_NODE_URL);

  web3: Web3 | undefined;

  constructor(web3?: Web3) {
    this.web3 = web3;
    this.axios = Axios.create({ baseURL: `${process.env.REACT_APP_SERVER_URL}/v1` });
    this.axios.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (
          [
            '/liquidity-pool/orders/add-liquidity',
            '/liquidity-pool/orders/cancel',
            '/liquidity-pool/orders/remove-liquidity',
            '/liquidity-pool/create',
          ].includes(error.config.url ?? '')
        ) {
          Modal.error({
            content:
              error.response?.data?.message ||
              error.message ||
              'The transaction was generated failed, please try later',
          });
          throw error;
        } else {
          throw error;
        }
      },
    );
  }

  async getAssetList(): Promise<Asset[]> {
    const res = await this.axios.post('/get-default-asset-list');
    return res.data;
  }

  async generateCancelLiquidityRequestTransaction(
    payload: GenerateCancelRequestTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    const res = await this.axios.post<SerializedTransactionToSignWithFee>('/liquidity-pool/orders/cancel', payload);
    if (!res.data.transactionToSign) {
      // @ts-ignore
      res.data.transactionToSign = res.data.tx;
    }
    return res.data;
  }

  async generateAddLiquidityTransaction(
    payload: GenerateAddLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    const res = await this.axios.post('/liquidity-pool/orders/add-liquidity', { ...payload });

    return {
      transactionToSign: res.data.tx as SerializedTransactonToSign,
      fee: res.data.fee as string,
    };
  }

  async generateRemoveLiquidityTransaction(
    payload: GenerateRemoveLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    const res = await this.axios.post('/liquidity-pool/orders/remove-liquidity', payload);

    return {
      fee: res.data.fee,
      transactionToSign: res.data.tx,
    };
  }

  async getAssetsWithBalance(lock: CkbScript, assets?: Asset[]): Promise<GliaswapAssetWithBalance[]> {
    if (!assets) {
      const res = await this.axios.post('/get-asset-with-balance', { lock });
      return res.data;
    }

    const nervosChainSpecs = assets.filter(CkbModel.isCurrentChainAsset).map(CkbModel.getChainSpec);
    const ckbAssets = await this.axios.post<
      (CkbNativeAssetWithBalance | CkbSudtAssetWithBalance | ShadowFromEthWithBalance)[]
    >('/get-asset-with-balance', {
      lock,
      assets: nervosChainSpecs,
    });

    const ethAsset: EthAsset = assets.find(EthModel.isNativeAsset)!;
    const erc20Assets: EthErc20Asset[] = assets.filter(EthModel.isEthErc20Asset);
    try {
      const web3 = this.web3!;
      const ethAddr = web3.utils.toChecksumAddress(lock.args);
      const ethAssets = await Promise.all([
        this.getEthBalance(web3!, ethAddr!, ethAsset),
        ...erc20Assets.map((a) => this.getErc20Balance(web3, ethAddr, a)),
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

  async getLiquidityInfo(filter: LiquidityInfoFilter): Promise<Maybe<LiquidityInfo>> {
    const res = await this.axios.post('/liquidity-pool/pool-id', {
      poolId: filter.poolId,
      lock: filter.lock,
    });

    if (!res.data) return;
    // TODO DONT create asset here, use the server response
    res.data.lpToken = merge(
      createAssetWithBalance(
        {
          chainType: 'Nervos',
          typeHash: '',
          decimals: Math.ceil(
            res.data.assets.reduce((lpTokenDecimal: number, asset: Asset) => lpTokenDecimal + asset.decimals, 0) / 2,
          ),
        },
        res.data.total,
      ),
      res.data.lpToken,
    );
    return res.data;
  }

  async getLiquidityPools(filter: LiquidityPoolFilter | undefined): Promise<PoolInfoWithStatus[]> {
    function convertResponse(liquidityRes: LiquidityResponse[]): PoolInfoWithStatus[] {
      return liquidityRes
        .map((item) => ({
          model: item.model as PoolModel,
          poolId: item.poolId,
          assets: item.assets as CkbAssetWithBalance[],
          status: item.status,
        }))
        .sort((asset) => (asset.status === 'pending' ? 1 : 0)); // move the pending items to the end
    }

    const res = await this.axios.post<LiquidityResponse[]>('/liquidity-pool', filter);

    // TODO the server asset balance is wrong, this is a patch to fix the server error
    if (filter?.lock) {
      const poolsRes = await this.axios.post<LiquidityResponse[]>('/liquidity-pool');

      const userLiquidates = res.data;
      const poolLiquidates = poolsRes.data;

      userLiquidates.forEach((userLiquidity) => {
        const poolLiquidity = poolLiquidates.find((pool) => pool.poolId === userLiquidity.poolId);
        if (!userLiquidity || !poolLiquidity) throw new Error(`cannot find the pool of ${userLiquidity.poolId}`);

        userLiquidity.assets.forEach((asset, i) => {
          asset.balance = BN(userLiquidity.lpToken.balance)
            .times(poolLiquidity.assets[i].balance)
            .div(poolLiquidity.total)
            .decimalPlaces(0)
            .toString();
        });
      });

      return convertResponse(userLiquidates);
    }

    return convertResponse(res.data);
  }

  async getLiquidityOperationSummaries(filter: LiquidityOperationSummaryFilter): Promise<LiquidityOperationSummary[]> {
    const summariesRes = await this.axios.post<ServerTypes.LiquidityOperationInfo[]>(`/liquidity-pool/orders`, filter);
    const summaries = ServerTypes.transformLiquidityOperationInfo(summariesRes.data);
    // TODO the lpToken amount of add summaries in response is wrong, replace me when server fixed it
    const pool = await this.getLiquidityInfo({ poolId: filter.poolId });
    if (!pool) throw new Error(`Cannot find the pool ${filter.poolId}`);

    if (filter.stage && filter.stage.length > 0) {
      return summaries.filter((summary) => filter.stage?.includes(summary.stage.status));
    }
    return summaries;
  }

  async getSwapOrders(lock: CkbScript, ethAddress: string): Promise<SwapOrder[]> {
    const res = await this.axios.post('/swap/orders', {
      lock,
      ethAddress,
      limit: 0,
      skip: 0,
    });

    return res.data;
  }

  async cancelSwapOrders(txHash: string, lock: CkbScript): Promise<{ tx: Transaction }> {
    const { data } = await this.axios.post('/swap/orders/cancel', { txHash, lock }).catch((err) => {
      return Promise.reject(err?.response?.data ?? err);
    });
    return { tx: TransactionHelper.deserializeTransactionToSign(data.tx) };
  }

  async getSwapOrderLock(
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: CkbScript,
  ): Promise<{ lock: CkbScript }> {
    const { data } = await this.axios
      .post('/swap/orders/swap-lock', {
        assetInWithAmount: {
          ...tokenA,
          address: '',
        },
        assetOutWithMinAmount: {
          ...tokenB,
          address: '',
        },
        lock,
        tips: {
          typeHash: CKB_NATIVE_TYPE_HASH,
          chainType: 'Nervos',
          decimals: 8,
          logoURI: '',
          name: 'CKB',
          balance: '0',
          symbol: 'CKB',
          address: '',
        },
      })
      .catch((err) => {
        return Promise.reject(err?.response?.data ?? err);
      });

    return data;
  }

  async swapNormalOrder(
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: CkbScript,
  ): Promise<{ tx: Transaction }> {
    const { data } = await this.axios
      .post('/swap/orders/swap', {
        assetInWithAmount: {
          ...tokenA,
          address: '',
        },
        assetOutWithMinAmount: {
          ...tokenB,
          address: '',
        },
        lock,
        tips: {
          typeHash: CKB_NATIVE_TYPE_HASH,
          chainType: 'Nervos',
          decimals: 8,
          logoURI: '',
          name: 'CKB',
          balance: '0',
          symbol: 'CKB',
          address: '',
        },
      })
      .catch((err) => {
        return Promise.reject(err?.response?.data ?? err);
      });
    const tx = TransactionHelper.deserializeTransactionToSign(data.tx);
    return {
      tx,
    };
  }

  searchSUDT = async (typeHash: string): Promise<CkbAsset | undefined> => {
    const params = {
      typeHashOrAddress: typeHash,
    };

    const res = await this.axios.post(`/tokens/search`, params);

    if (isEmpty(res.data)) {
      return undefined;
    }

    const [{ info: asset }] = res.data;

    return {
      ...asset,
      decimals: asset.decimal ? parseInt(asset.decimal, 10) : 8,
      symbol: asset.symbol || 'Unknown Token',
      name: asset.name || 'Unknown Token',
      chainType: 'Nervos',
    };
  };

  async searchERC20(address: string): Promise<EthErc20AssetWithBalance | undefined> {
    try {
      const web3 = this.web3!;
      const contract = new web3.eth.Contract(INFO_ABI, address);
      const name = await contract.methods.name().call();
      const symbol = await contract.methods.symbol().call();
      const decimals = await contract.methods.decimals().call();
      return {
        name,
        address,
        symbol,
        balance: '0',
        chainType: 'Ethereum',
        decimals: parseInt(decimals, 10),
      };
    } catch (error) {
      return undefined;
    }
  }

  async generateCreateLiquidityPoolTransaction(
    payload: GenerateCreateLiquidityPoolTransactionPayload,
  ): Promise<GenerateCreateLiquidityPoolTransactionResponse> {
    payload = update(payload, { assets: (assets) => assets.map((asset) => createAssetWithBalance(asset)) });
    const res = await this.axios.post('/liquidity-pool/create', payload);
    if (!res.data.transactionToSign) {
      // @ts-ignore
      res.data.transactionToSign = res.data.tx;
    }
    return res.data;
  }

  generateGenesisLiquidityTransaction(
    _payload: GenerateGenesisLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  generateSwapTransaction(_payload_: GenerateSwapTransactionPayload): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  async getPoolInfoWithStatus(filter: PoolInfoWithStatusFilter): Promise<Maybe<PoolInfoWithStatus>> {
    const res = await this.axios.post('/liquidity-pool-status', {
      tokenAHash: filter.assets[0].typeHash,
      tokenBHash: filter.assets[1].typeHash,
    });

    if (!res.data) return;

    // TODO DONT create asset here, use the server response
    res.data.lpToken = merge(
      createAssetWithBalance(
        {
          chainType: 'Nervos',
          typeHash: '',
          decimals: Math.ceil(
            res.data.assets.reduce((lpTokenDecimal: number, asset: Asset) => lpTokenDecimal + asset.decimals, 0) / 2,
          ),
        },
        res.data.total,
      ),
      res.data.lpToken,
    );

    return res.data;
  }
}
