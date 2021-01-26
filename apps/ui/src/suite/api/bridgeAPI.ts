import { EthErc20AssetWithBalance } from '@gliaswap/commons';
import { Amount, AmountUnit } from '@lay2/pw-core';
import BigNumber from 'bignumber.js';
import { CROSS_CHAIN_FEE, FORCE_BRIDGER_SERVER_URL } from 'suite/constants';
import Web3 from 'web3';
import axios from 'axios';
import { APPROVE_ABI, BRIDGE_SETTINGS } from './abi';

const toHexString = (str: string | number) => {
  return `0x${new BigNumber(str).toString(16)}`;
};

const uint256Max = `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;

export class BridgeAPI {
  public bridgeSettings = BRIDGE_SETTINGS;

  constructor() {
    this.init();
  }

  async init() {
    this.bridgeSettings = await this.getForceBridgeSettings();
  }

  async shadowAssetCrossOut(asset: EthErc20AssetWithBalance, ckbAddress: string, ethAddress: string) {
    const payWithDecimal = new BigNumber(asset.balance);
    const amount = `0x${payWithDecimal.toString(16)}`;
    const unlockFee = `0x${payWithDecimal.times(CROSS_CHAIN_FEE).toString(16)}`;

    return axios
      .post(`${FORCE_BRIDGER_SERVER_URL}/burn`, {
        from_lockscript_addr: ckbAddress,
        unlock_fee: unlockFee,
        amount,
        token_address: asset.address,
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

  async shadowAssetCrossIn(asset: EthErc20AssetWithBalance, ckbAddress: string, ethAddress: string, web3: Web3) {
    const amount = `0x${new BigNumber(asset.balance).toString(16)}`;
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(ethAddress);
    return axios.post(`${FORCE_BRIDGER_SERVER_URL}/lock`, {
      token_address: asset.address.slice(2),
      amount,
      bridge_fee: '0x0',
      ckb_recipient_address: ckbAddress,
      sudt_extra_data: '',
      gas_price: toHexString(gasPrice),
      nonce: toHexString(nonce),
      sender: ethAddress,
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
    console.log(erc20Address, ethAddress);
    return contract.methods.allowance(ethAddress, this.bridgeSettings.eth_token_locker_addr).call();
  }
}
