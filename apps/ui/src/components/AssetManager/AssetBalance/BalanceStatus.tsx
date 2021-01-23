import { isCkbNativeAsset } from '@gliaswap/commons';
import { AssetSymbol } from 'components/Asset';
import { Description } from 'components/AssetManager/AssetBalance/Description';
import { ManagerAsset } from 'components/AssetManager/hooks';
import { HumanizeBalance } from 'components/Balance';
import i18n from 'i18n';
import React from 'react';
import styled from 'styled-components';
import { calcTotalBalance } from 'suite';

const BalanceStatusWrapper = styled.div`
  padding: 24px 24px 0;
  text-align: center;

  .space-bottom {
    margin-bottom: 16px;

    &-large {
      margin-bottom: 32px;
    }
  }

  .balance-desc {
    display: flex;

    &-item {
      border-right: 1px solid #e1e1e1;
      flex: 1;

      :last-child {
        border-right: none;
        padding: 0 4px;
      }
    }
  }
`;

interface BalanceStatusProps {
  showAssetSymbolIcon?: boolean;
  asset: ManagerAsset;
}

export const BalanceStatus: React.FC<BalanceStatusProps> = (props) => {
  const { showAssetSymbolIcon, asset } = props;

  const free = asset.balance;
  const occupied = isCkbNativeAsset(asset) ? asset.occupied : '';
  const locked = asset.locked;

  return (
    <BalanceStatusWrapper>
      {showAssetSymbolIcon && (
        <div className="space-bottom">{<AssetSymbol style={{ fontSize: '20px' }} asset={asset} />}</div>
      )}
      <div className="space-bottom">
        <HumanizeBalance style={{ fontSize: '24px' }} asset={asset} value={calcTotalBalance(asset)} />
      </div>
      <div className="balance-desc space-bottom">
        <div className="balance-desc-item">
          <Description label={i18n.t('Available')}>
            <HumanizeBalance asset={asset} value={free} />
          </Description>
        </div>
        {isCkbNativeAsset(asset) && (
          <div className="balance-desc-item">
            <Description label={i18n.t('Occupied')}>
              <HumanizeBalance asset={asset} value={occupied} />
            </Description>
          </div>
        )}
        <div className="balance-desc-item">
          <Description label={i18n.t('Locked')}>
            <HumanizeBalance asset={asset} value={locked} />
          </Description>
        </div>
      </div>
    </BalanceStatusWrapper>
  );
};
