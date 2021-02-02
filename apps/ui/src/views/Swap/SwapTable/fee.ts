import { GliaswapAssetWithBalance } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';

const SWAP_FEE = BigInt(997);
const FEE_DECIMAL = BigInt(1000);

export function calcReceiveWithPay(pay: string, payReserve: string, receiveReserve: string) {
  const p = BigInt(pay);
  const pR = BigInt(payReserve);
  const rR = BigInt(receiveReserve);

  try {
    const receive = (SWAP_FEE * p * rR) / (SWAP_FEE * p + FEE_DECIMAL * pR);
    return receive.toString();
  } catch (error) {
    return '0';
  }
}

export function calcPayWithReceive(receive: string, payReserve: string, receiveReserve: string) {
  const r = BigInt(receive || 0);
  const pR = BigInt(payReserve);
  const rR = BigInt(receiveReserve);

  try {
    const pay = (FEE_DECIMAL * pR * r) / (SWAP_FEE * (rR - r));
    return pay.toString();
  } catch (error) {
    return '';
  }
}

export function calcPrice(pay: string, receive: string, isBid: boolean) {
  if (isBid) {
    return new BigNumber(pay).times(receive).toString();
  }

  return new BigNumber(receive).div(pay).toString();
}

export function calcPriceImpact(ckbReserve: string, sudtReserve: string, price: string, sudtDecimal: number) {
  const ps = new BigNumber(ckbReserve)
    .div(10 ** 8)
    .div(new BigNumber(sudtReserve).div(new BigNumber(10).pow(sudtDecimal)));
  return new BigNumber(price).minus(ps).absoluteValue().div(ps).toFixed(4, 1);
}

export function calcBalance(val: string, token: GliaswapAssetWithBalance): GliaswapAssetWithBalance {
  return {
    ...token,
    balance: new BigNumber(val).times(new BigNumber(10).pow(token.decimals)).toString(),
  };
}

export function getValueFromInput(input: string, decimal: number) {
  const val = new BigNumber(input).times(new BigNumber(10).pow(decimal));
  if (val.isNaN()) {
    return '';
  }
  BigNumber.config({ EXPONENTIAL_AT: 30 });
  return val.toFixed();
}

export function getInputFromValue(value: string, decimal: number) {
  const val = new BigNumber(value).div(new BigNumber(10).pow(decimal));
  if (val.isNaN()) {
    return '';
  }
  BigNumber.config({ EXPONENTIAL_AT: 30 });
  return val.toFixed();
}

export function displayPercent(val: string) {
  const percent = new BigNumber(val).times(100);
  if (percent.isLessThan(0.01)) {
    return '< 0.01 %';
  }

  return `${percent.toFixed(2, BigNumber.ROUND_DOWN)} %`;
}
