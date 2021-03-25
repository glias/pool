import { buildEnv } from '@gliaswap/commons';
import { BigNumber } from 'bignumber.js';

BigNumber.config({ EXPONENTIAL_AT: 1e9 });

export const UIEnvs = buildEnv({
  EXPLORER_URL: process.env.REACT_APP_CKB_EXPLORER_URL,
  ETHERSCAN_URL: process.env.REACT_APP_ETHERSCAN_URL || 'https://rinkeby.etherscan.io',
  DOCS_URL: process.env.REACT_APP_DOCS_URL || 'https://zoe-zhouzhou.github.io/gliaswap-docs/docs',
  ETH_CHAIN_NAME: process.env.REACT_APP_ETH_CHAIN_NAME || 'Rinkeby',
  ETH_CHAIN_ID: process.env.REACT_APP_ETH_CHAIN_ID || '4',
  FAUCET_URL: process.env.REACT_APP_FAUCET_URL || 'https://gliaswap-faucet-rinkeby.ckbapp.dev',
});

export function explore(url: string): string {
  return UIEnvs.get('EXPLORER_URL') + url;
}

export function docsFaq(hashtag: string) {
  return `${UIEnvs.get('DOCS_URL')}/ref/faq/#${hashtag}`;
}

export function exploreAddress(address: string): string {
  return `${UIEnvs.get('EXPLORER_URL')}/address/${address}`;
}

export function etherscanTransaction(txhash: string): string {
  return `${UIEnvs.get('ETHERSCAN_URL')}/tx/${txhash}`;
}

export function exploreSudt(typeHash: string, address?: string): string {
  return `${UIEnvs.get('EXPLORER_URL')}/sudt/${typeHash}?address=${address}`;
}

// TODO locale to typeHash
export function exploreTypeHash(typeHash: string): string {
  return explore(`/type/${typeHash}`);
}

export function exploreBlock(blockNumber: number): string {
  return explore(`/block/${blockNumber}`);
}

export function exploreTransaction(txHash: string): string {
  return explore(`/transaction/${txHash}`);
}
