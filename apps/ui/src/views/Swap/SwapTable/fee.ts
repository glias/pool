import { GliaswapAssetWithBalance } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';

const SWAP_FEE = new BigNumber(997);
const FEE_DECIMAL = new BigNumber(1000);

export function calcReceiveWithPay(pay: string, payReserve: string, receiveReserve: string) {
  const p = new BigNumber(pay);
  const pR = new BigNumber(payReserve);
  const rR = new BigNumber(receiveReserve);

  try {
    // const receive = (SWAP_FEE * p * rR) / (SWAP_FEE * p + FEE_DECIMAL * pR);
    const receive = SWAP_FEE.times(p)
      .times(rR)
      .div(SWAP_FEE.times(p).plus(FEE_DECIMAL.times(pR)));
    return receive.toFixed(0);
  } catch (error) {
    return '0';
  }
}

export function calcPayWithReceive(receive: string, payReserve: string, receiveReserve: string) {
  const r = new BigNumber(receive || 0);
  const pR = new BigNumber(payReserve);
  const rR = new BigNumber(receiveReserve);

  try {
    // const pay = (FEE_DECIMAL * pR * r) / (SWAP_FEE * (rR - r));
    const pay = FEE_DECIMAL.times(pR)
      .times(r)
      .div(SWAP_FEE.times(rR.minus(r)));
    return pay.toFixed(0);
  } catch (error) {
    return '';
  }
}

export function calcPrice(pay: string, receive: string, isBid: boolean) {
  if (isBid) {
    return new BigNumber(pay).div(receive).toString();
  }

  return new BigNumber(receive).div(pay).toString();
}

export function calcPriceImpact(aReserve: string, bReserve: string, price: string, aDecimal: number, bDecimal: number) {
  const ps = new BigNumber(bReserve)
    .div(10 ** bDecimal)
    .div(new BigNumber(aReserve).div(new BigNumber(10).pow(aDecimal)));
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

  return val.toFixed();
}

export function getInputFromValue(value: string, decimal: number) {
  const val = new BigNumber(value).div(new BigNumber(10).pow(decimal));
  if (val.isNaN()) {
    return '';
  }

  return val.toFixed();
}

export function displayPercent(val: string) {
  const percent = new BigNumber(val).times(100);
  if (percent.isLessThan(0.01)) {
    return '< 0.01 %';
  }

  return `${percent.toFixed(2, BigNumber.ROUND_DOWN)} %`;
}

export function toStringNumberOrZero(val: string | undefined) {
  const v = new BigNumber(val ?? '0');
  return v.isNaN() ? '0' : v.toFixed();
}

export function toHexRoundUp(bn: BigNumber) {
  return new BigNumber(bn.toFixed(0, BigNumber.ROUND_UP)).toString(16);
}
