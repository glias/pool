import { AssetWithBalance } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { BN } from 'suite/asset';

abstract class CommonsBalance {
  value: BigNumber;
  assetDecimals: number;

  protected constructor(value: BigNumber.Value, assetDecimals: number) {
    this.value = BN(value);
    this.assetDecimals = assetDecimals;
  }
}

export class BalanceWithDecimal extends CommonsBalance {
  static from(value: BigNumber.Value, assetDecimals: number) {
    return new BalanceWithDecimal(value, assetDecimals);
  }

  static fromAssetWithBalance(asset: AssetWithBalance): BalanceWithDecimal {
    return BalanceWithoutDecimal.fromAssetWithBalance(asset).withDecimal();
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

  static fromAssetWithBalance(asset: AssetWithBalance): BalanceWithoutDecimal {
    return new BalanceWithoutDecimal(asset.balance, asset.decimals);
  }

  withDecimal(): BalanceWithDecimal {
    return new BalanceWithDecimal(this.value.times(10 ** -this.assetDecimals), this.assetDecimals);
  }
}
