import { AssetWithBalance } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { BN } from 'suite/asset';

abstract class CommonsBalance {
  value: BigNumber;
  assetDecimals: number;

  protected constructor(value: BigNumber.Value, assetDecimals: number) {
    this.assetDecimals = assetDecimals;
    this.value = BN(value).decimalPlaces(assetDecimals, BigNumber.ROUND_DOWN);
  }
}

export class BalanceWithDecimal extends CommonsBalance {
  static from(value: BigNumber.Value, assetDecimals: number) {
    return new BalanceWithDecimal(value, assetDecimals);
  }

  static fromAsset(asset: AssetWithBalance): BalanceWithDecimal {
    return BalanceWithoutDecimal.fromAsset(asset).withDecimal();
  }

  newValue(this: BalanceWithDecimal, value: BigNumber.Value): BalanceWithDecimal {
    return new BalanceWithDecimal(value, this.assetDecimals);
  }

  toHumanize(decimalPlaces = 4): string {
    return this.value.decimalPlaces(decimalPlaces).toString();
  }

  withoutDecimal(this: BalanceWithDecimal): BalanceWithoutDecimal {
    return new BalanceWithoutDecimal(this.value.times(10 ** this.assetDecimals), this.assetDecimals);
  }
}

export class BalanceWithoutDecimal extends CommonsBalance {
  static from(value: BigNumber.Value, assetDecimals: number): BalanceWithoutDecimal {
    return new BalanceWithoutDecimal(value, assetDecimals);
  }

  static fromAsset(asset: AssetWithBalance): BalanceWithoutDecimal {
    return new BalanceWithoutDecimal(asset.balance, asset.decimals);
  }

  newValue(this: BalanceWithoutDecimal, value: BigNumber.Value): BalanceWithoutDecimal {
    return new BalanceWithoutDecimal(value, this.assetDecimals);
  }

  withDecimal(): BalanceWithDecimal {
    return new BalanceWithDecimal(this.value.times(10 ** -this.assetDecimals), this.assetDecimals);
  }
}
