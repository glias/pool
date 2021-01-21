import { BigNumber } from 'bignumber.js';

const FEE_DECIMAL = new BigNumber('1000');

export function getAddLiquidityPairedAssetPayAmount(
  assetAmount: BigNumber,
  assetReserve: BigNumber,
  pairedAssetReserve: BigNumber,
): BigNumber {
  return assetAmount.multipliedBy(pairedAssetReserve).div(assetReserve).plus(1);
}

export function getRemoveLiquidityReceiveAssetAmount(
  lpAssetAmount: BigNumber,
  receiveAssetReserve: BigNumber,
  lpAssetReserve: BigNumber,
): BigNumber {
  return lpAssetAmount.multipliedBy(receiveAssetReserve).div(lpAssetReserve);
}

// fee: fee pay to liquidity pool, for example, 3 means pay 0.3% to liquidity pool
export function getSwapReceiveAmount(
  payAssetAmount: BigNumber,
  payAssetReserve: BigNumber,
  receiveAssetReserve: BigNumber,
  fee: BigNumber,
): BigNumber {
  const numerator = FEE_DECIMAL.minus(fee).multipliedBy(receiveAssetReserve);
  const denominator = FEE_DECIMAL.minus(fee)
    .multipliedBy(payAssetAmount)
    .plus(FEE_DECIMAL.multipliedBy(payAssetReserve));
  return numerator.div(denominator);
}

export function getSwapPayAmount(
  receiveAssetAmount: BigNumber,
  payAssetReserve: BigNumber,
  receiveAssetReserve: BigNumber,
  fee: BigNumber,
): BigNumber {
  const numerator = FEE_DECIMAL.multipliedBy(payAssetReserve).multipliedBy(receiveAssetAmount);
  const denominator = FEE_DECIMAL.minus(fee).multipliedBy(receiveAssetReserve.minus(receiveAssetAmount));
  return numerator.div(denominator);
}
