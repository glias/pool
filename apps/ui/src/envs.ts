import { buildEnv } from '@gliaswap/commons';
import { BigNumber } from 'bignumber.js';

BigNumber.config({ EXPONENTIAL_AT: 1e9 });

export const UIEnvs = buildEnv({
  EXPLORER_URL: process.env.REACT_APP_CKB_EXPLORER_URL,
});

export function explore(url: string): string {
  return UIEnvs.get('EXPLORER_URL') + url;
}

export function exploreAddress(address: string): string {
  return `${UIEnvs.get('EXPLORER_URL')}/address/${address}`;
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
  return explore(`/transactions/${txHash}`);
}
