import {
  Asset,
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  EthAsset,
  EthErc20Asset,
  EthErc20AssetWithBalance,
  EthNativeAssetWithBalance,
  GenerateAddLiquidityTransactionPayload,
  GenerateCancelRequestTransactionPayload,
  GenerateCreateLiquidityPoolTransactionPayload,
  GenerateCreateLiquidityPoolTransactionResponse,
  GenerateGenesisLiquidityTransactionPayload,
  GenerateRemoveLiquidityTransactionPayload,
  GenerateSwapTransactionPayload,
  getCkbChainSpec,
  GliaswapAPI,
  GliaswapAssetWithBalance,
  isCkbChainSpec,
  isEthErc20Asset,
  isEthNativeAsset,
  LiquidityInfo,
  LiquidityInfoFilter,
  LiquidityOperationSummaryFilter,
  LiquidityPoolFilter,
  LiquidityRequestSummary,
  Maybe,
  PoolInfo,
  Script as CkbScript,
  SerializedTransactionToSignWithFee,
  SerializedTransactonToSign,
  ShadowFromEthWithBalance,
  SwapOrder,
} from '@gliaswap/commons';
import {
  Amount,
  AmountUnit,
  Builder,
  Cell,
  CellDep,
  DepType,
  OutPoint,
  RawTransaction,
  Script,
  Transaction,
} from '@lay2/pw-core';
import CKB from '@nervosnetwork/ckb-sdk-core';
import Axios, { AxiosInstance } from 'axios';
import { uniqWith } from 'lodash';
// import { DummyGliaswapAPI } from 'suite/api/DummyGliaswapAPI';
import { createAssetWithBalance } from 'suite/asset';
import { CKB_NATIVE_TYPE_HASH, CKB_NODE_URL } from 'suite/constants';
import Web3 from 'web3';
import * as ServerTypes from './types';

function fromJSONToPwCell(cell: any) {
  const { data } = cell;
  if (cell.index && cell.txHash) {
    cell.outPoint = {
      index: cell.index,
      txHash: cell.txHash,
    };
  }

  return new Cell(
    new Amount(cell.capacity as any, AmountUnit.shannon),
    new Script(cell.lock.codeHash, cell.lock.args, cell.lock.hashType),
    cell.type ? new Script(cell.type.codeHash, cell.type.args, cell.type.hashType) : undefined,
    cell.outPoint ? new OutPoint(cell.outPoint.txHash, cell.outPoint.index) : undefined,
    data ?? '0x',
  );
}

export const SUDT_DEP = new CellDep(
  DepType.code,
  new OutPoint('0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769', '0x0'),
);

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
    const res = await this.axios.post<SerializedTransactionToSignWithFee>(
      '/liquidity-pool/orders/remove-liquidity',
      payload,
    );
    return res.data;
  }

  async getAssetsWithBalance(
    lock: CkbScript,
    assets?: Asset[],
    ethAddr?: string,
    web3?: Web3,
  ): Promise<GliaswapAssetWithBalance[]> {
    if (!assets) {
      const res = await this.axios.post('/get-asset-with-balance', { lock });
      return res.data;
    }

    const nervosChainSpecs = assets.filter(isCkbChainSpec).map(getCkbChainSpec);
    const ckbAssets = await this.axios.post<
      (CkbNativeAssetWithBalance | CkbSudtAssetWithBalance | ShadowFromEthWithBalance)[]
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

  // TODO uncomment me when server api is fixed
  async getLiquidityInfo(filter: LiquidityInfoFilter): Promise<Maybe<LiquidityInfo>> {
    const res = await this.axios.post('/liquidity-pool/pool-id', {
      poolId: filter.poolId,
      lock: filter.lock,
    });

    if (!res.data) return;
    // TODO DONT create asset here, use the server response
    if (!res.data.lpToken)
      res.data.lpToken = createAssetWithBalance({ chainType: 'Nervos', typeHash: '' }, res.data.total);
    return res.data;
  }

  async getLiquidityPools(filter: LiquidityPoolFilter | undefined): Promise<PoolInfo[]> {
    const res = await this.axios.post<PoolInfo[]>('/liquidity-pool', filter);
    return res.data;
  }

  // TODO uncomment me when server api is fixed
  async getLiquidityOperationSummaries(filter: LiquidityOperationSummaryFilter): Promise<LiquidityRequestSummary[]> {
    const res = await this.axios.post<ServerTypes.LiquidityOperationInfo[]>(`/liquidity-pool/orders`, filter);
    return ServerTypes.transformLiquidityOperationInfo(res.data);
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
    const { data } = await this.axios.post('/swap/orders/cancel', { txHash, lock });
    return { tx: this.toPwTransactionInstance(data.tx) };
  }

  async swapNormalOrder(
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: CkbScript,
  ): Promise<{ tx: Transaction }> {
    const { data } = await this.axios.post('/swap/orders/swap', {
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
    });

    return {
      tx: this.toPwTransactionInstance(data.tx),
    };
  }

  toPwTransactionInstance(transaction: Transaction['raw']) {
    const { inputCells } = transaction;
    const outputs = (transaction as any).outputCells;
    const cellDeps = transaction.cellDeps.map(
      (cd) =>
        new CellDep(
          cd.depType === 'code' ? DepType.code : DepType.depGroup,
          new OutPoint(cd.outPoint.txHash, cd.outPoint.index),
        ),
    );
    const tx = new Transaction(
      new RawTransaction(inputCells.map(fromJSONToPwCell), outputs.map(fromJSONToPwCell), cellDeps),
      [Builder.WITNESS_ARGS.Secp256k1],
    );

    tx.raw.cellDeps.push(SUDT_DEP);

    tx.raw.cellDeps = uniqWith(tx.raw.cellDeps, (a, b) => a.sameWith(b));

    return tx.validate();
  }

  generateCancelRequestTransaction(
    _payload: GenerateCancelRequestTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  generateCreateLiquidityPoolTransaction(
    _payload: GenerateCreateLiquidityPoolTransactionPayload,
  ): Promise<GenerateCreateLiquidityPoolTransactionResponse> {
    return Promise.resolve({} as any);
  }

  generateGenesisLiquidityTransaction(
    _payload: GenerateGenesisLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  generateSwapTransaction(_payload_: GenerateSwapTransactionPayload): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }
}
