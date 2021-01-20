import Script from './script';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
}

export default class Token {
  typeHash: string;
  typeScript?: Script | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;
}
