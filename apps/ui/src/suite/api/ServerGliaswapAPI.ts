import {
  Asset,
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  EthErc20Asset,
  EthNativeAssetWithBalance,
  GenerateAddLiquidityTransactionPayload,
  GenerateCancelRequestTransactionPayload,
  GenerateCreateLiquidityPoolTransactionPayload,
  GenerateCreateLiquidityPoolTransactionResponse,
  GenerateGenesisLiquidityTransactionPayload,
  GenerateSwapTransactionPayload,
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
  SerializedTransactionToSignWithFee,
  ShadowFromEthWithBalance,
  SwapOrder,
  EthErc20AssetWithBalance,
  isEthNativeAsset,
  isEthErc20Asset,
  EthAsset,
  Script as CkbScript,
} from '@gliaswap/commons';
import Axios, { AxiosInstance } from 'axios';
import { DummyGliaswapAPI } from 'suite/api/DummyGliaswapAPI';
import Web3 from 'web3';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { CKB_NATIVE_TYPE_HASH, CKB_NODE_URL } from 'suite/constants';
import {
  Amount,
  AmountUnit,
  Cell,
  Script,
  Transaction,
  OutPoint,
  RawTransaction,
  Builder,
  CellDep,
  DepType,
} from '@lay2/pw-core';

const api = new DummyGliaswapAPI();

function fromJSONToPwCell(cell: any) {
  const { data } = cell;
  if (cell.index && cell.txHash) {
    cell.outPoint = {
      index: cell.index,
      txHash: cell.txHash,
    };
  }
  // debugger;
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

  cancelOperation(_txHash: string, _lock: CkbScript): Promise<SerializedTransactionToSignWithFee> {
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
    // TODO replace with server api
    return Promise.resolve({ fee: (Math.random() * 10 ** 8).toFixed(8), transactionToSign: {} as any });
  }

  getAddLiquidityOrderSummaries(_filter: LiquidityOrderSummaryFilter): Promise<LiquidityOrderSummary[]> {
    return Promise.resolve([]);
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

    // @ts-ignore
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
    const { data } = await this.axios.post('/swap/orders/cancel', {
      txHash,
      lock,
    });

    return {
      tx: this.toPwTransactionInstance(data.tx),
    };
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
    const tx = new Transaction(new RawTransaction(inputCells.map(fromJSONToPwCell), outputs.map(fromJSONToPwCell)), [
      Builder.WITNESS_ARGS.Secp256k1,
    ]);

    tx.raw.cellDeps.push(SUDT_DEP);

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
