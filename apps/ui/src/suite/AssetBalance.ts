import BigNumber from 'bignumber.js';
import { BN } from 'suite/asset';

type DecimalsAndBalance = {
  /**
   * decimal of an asset
   */
  decimals: number;
  balance: BigNumber.Value;
};

abstract class CommonsBalance {
  value: BigNumber;
  assetDecimals: number;

  protected constructor(value: BigNumber.Value, assetDecimals: number) {
    this.assetDecimals = assetDecimals;
    this.value = BN(value).decimalPlaces(assetDecimals, BigNumber.ROUND_DOWN);
  }
}

// the Asset have a decimals property, but decimals should often be ignored when calculating them,
// decimals are more for the purpose of keeping the asset's value from being too large when displayed,
// e.g. `1 ckb = 10^8 shannon`, typically displayed as `1 ckb`, but the actual value is `10^8`
export class Amount extends CommonsBalance {
  constructor(value: BigNumber.Value, assetDecimals: number, valueWithDecimal?: boolean) {
    if (valueWithDecimal) super(BN(value).times(10 ** assetDecimals), assetDecimals);
    else super(value, assetDecimals);
  }

  static fromZero(decimals: number): Amount {
    return new Amount(0, decimals);
  }

  static from(balance: BigNumber.Value = 0, decimals: number): Amount {
    return new Amount(balance, decimals);
  }

  static fromHumanize(humanizeBalance: string, decimals: number) {
    return new Amount(humanizeBalance, decimals, true);
  }

  static fromAsset({ balance, decimals }: DecimalsAndBalance) {
    return new Amount(balance, decimals);
  }

  withoutDecimal(): BigNumber {
    return this.value;
  }

  withDecimal(): BigNumber {
    return this.value.times(10 ** -this.assetDecimals);
  }

  toHumanize(decimalPlaces = 4): string {
    const withDecimal = this.withDecimal();

    return withDecimal
      .decimalPlaces(Math.min(withDecimal.decimalPlaces(), decimalPlaces), BigNumber.ROUND_FLOOR)
      .toString();
  }

  toHumanizeWithMaxDecimal(): string {
    return this.withDecimal().decimalPlaces(this.assetDecimals).toString();
  }

  newValue(value: BigNumber.Value | ((balanceWithoutDecimal: BigNumber) => BigNumber.Value)): Amount {
    if (typeof value === 'function') return new Amount(value(this.value), this.assetDecimals);
    return new Amount(value, this.assetDecimals);
  }

  newValueWithDecimals(valueWithDecimal: string) {
    return Amount.fromHumanize(valueWithDecimal, this.assetDecimals);
  }
}
