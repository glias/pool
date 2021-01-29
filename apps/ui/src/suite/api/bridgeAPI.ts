import { EthErc20AssetWithBalance, ShadowFromEthWithBalance } from '@gliaswap/commons';
import { Amount, AmountUnit } from '@lay2/pw-core';
import BigNumber from 'bignumber.js';
import { CKB_NODE_URL, CROSS_CHAIN_FEE, FORCE_BRIDGER_SERVER_URL } from 'suite/constants';
import Web3 from 'web3';
import axios from 'axios';
import { RPC as ToolKitRpc } from 'ckb-js-toolkit';
import { Builder, Cell, CellDep, OutPoint, RawTransaction, Script, Transaction } from '@lay2/pw-core';
import type RPC from '@nervosnetwork/ckb-sdk-rpc';
import { APPROVE_ABI, BRIDGE_SETTINGS } from './abi';

const toHexString = (str: string | number) => {
  return `0x${new BigNumber(str).toString(16)}`;
};

const uint256Max = `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;

export const toolkitRPC = new ToolKitRpc(CKB_NODE_URL);

export class BridgeAPI {
  public bridgeSettings = BRIDGE_SETTINGS;

  constructor() {
    this.init();
  }

  async init() {
    this.bridgeSettings = await this.getForceBridgeSettings();
  }

  async shadowAssetCrossOut(asset: ShadowFromEthWithBalance, ckbAddress: string, ethAddress: string) {
    const payWithDecimal = new BigNumber(asset.balance);
    const amount = `0x${payWithDecimal.toString(16)}`;
    const unlockFee = `0x${payWithDecimal.times(CROSS_CHAIN_FEE).toString(16)}`;
    return axios
      .post(`${FORCE_BRIDGER_SERVER_URL}/burn`, {
        from_lockscript_addr: ckbAddress,
        unlock_fee: unlockFee,
        amount,
        token_address: asset.shadowFrom.address,
        recipient_address: ethAddress,
        sender: ethAddress,
      })
      .catch((err) => {
        const msg: string = err.response.data;
        const capacity = msg.split('need capacity:')?.[1]?.split(',')?.[0]?.trim();
        return Promise.reject(
          new Error(
            capacity
              ? `It will take at least ${new Amount(
                  capacity,
                  AmountUnit.shannon,
                ).toString()} CKB to complete this transaction.`
              : msg,
          ),
        );
      });
  }

  async lock(asset: EthErc20AssetWithBalance, ckbAddress: string, ethAddress: string, web3: Web3) {
    const amount = `0x${new BigNumber(asset.balance).toString(16)}`;
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(ethAddress);
    return axios
      .post(`${FORCE_BRIDGER_SERVER_URL}/lock`, {
        token_address: asset.address.slice(2),
        amount,
        bridge_fee: '0x0',
        ckb_recipient_address: ckbAddress,
        sudt_extra_data: '',
        gas_price: toHexString(gasPrice),
        nonce: toHexString(nonce),
        sender: ethAddress,
      })
      .catch((err) => {
        return Promise.reject(new Error(err.response.data));
      });
  }

  async getForceBridgeSettings(): Promise<typeof BRIDGE_SETTINGS> {
    return fetch(`${FORCE_BRIDGER_SERVER_URL}/settings`).then((res) => res.json());
  }

  async approveERC20ToBridge(ethAddress: string, erc20Address: string, web3: Web3, confirmCallback: () => void) {
    const contract = new web3.eth.Contract(APPROVE_ABI, erc20Address);
    return new Promise((resolve, reject) => {
      contract.methods
        .approve(this.bridgeSettings.eth_token_locker_addr, uint256Max)
        .send({ from: ethAddress })
        .once('transactionHash', () => {
          confirmCallback();
        })
        .once('receipt', (r: any) => {
          resolve(r);
        })
        .on('error', (err: any) => {
          reject(err);
        });
    });
  }

  async getAllowanceForTarget(ethAddress: string, erc20Address: string, web3: Web3) {
    const contract = new web3.eth.Contract(APPROVE_ABI, erc20Address);
    return contract.methods.allowance(ethAddress, this.bridgeSettings.eth_token_locker_addr).call();
  }

  async rawTransactionToPWTransaction(rawTx: RPC.RawTransaction): Promise<Transaction> {
    const inputs = await Promise.all(
      rawTx.inputs.map((i) =>
        Cell.loadFromBlockchain(toolkitRPC, new OutPoint(i.previous_output?.tx_hash!, i.previous_output?.index!)),
      ),
    );

    const outputs = rawTx.outputs.map(
      (o, index) =>
        new Cell(
          new Amount(o.capacity, AmountUnit.shannon),
          new Script(o.lock.code_hash, o.lock.args, o.lock.hash_type as any),
          o.type ? new Script(o.type.code_hash, o.type.args, o.type.hash_type as any) : undefined,
          undefined,
          rawTx.outputs_data[index],
        ),
    );

    const cellDeps = rawTx.cell_deps.map(
      (c) => new CellDep(c.dep_type as any, new OutPoint(c.out_point?.tx_hash!, c.out_point?.index!)),
    );

    const tx = new Transaction(new RawTransaction(inputs, outputs, cellDeps, rawTx.header_deps, rawTx.version), [
      Builder.WITNESS_ARGS.Secp256k1,
    ]);

    return tx;
  }
}
