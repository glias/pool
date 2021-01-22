import { DownOutlined } from '@ant-design/icons';
import { calcAddPoolShareInfo, LiquidityInfo } from '@gliaswap/commons';
import { Button, Form, Input, Typography } from 'antd';
import { AssetBalanceList, AssetBaseQuotePrices, AssetSymbol, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { SpaceBetweenRow } from 'components/Layout';
import i18n from 'i18n';
import React, { useState } from 'react';
import { RequestFeeLabel } from './components/RequestFeeLabel';
import { TransactionFeeLabel } from './components/TransactionFeeLabel';
import { OperationConfirmModal } from './OperationConfirmModal';

const { Text } = Typography;

interface AddLiquidityProps {
  poolLiquidity: LiquidityInfo;
}

export const AddLiquidity: React.FC<AddLiquidityProps> = (props) => {
  const [confirming, setConfirming] = useState(false);
  // const { api, currentUserLock } = useGliaswap();
  const poolLiquidity = props.poolLiquidity;
  const { assets } = poolLiquidity;
  const [asset1, asset2] = assets;

  const { requestFee, changedShare } = calcAddPoolShareInfo(poolLiquidity, []);

  return (
    <>
      <Form layout="vertical">
        <Form.Item label={i18n.t('Asset 1')}>
          <Input suffix={<AssetSymbol asset={asset1} />} />
        </Form.Item>
        <Form.Item label={i18n.t('Asset 2')}>
          <Input suffix={<AssetSymbol asset={asset2} />} />
        </Form.Item>
      </Form>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Price')}</div>
        <div>
          <AssetBaseQuotePrices assets={assets} prices={[asset1.balance, asset2.balance]} />
        </div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Add Pool Share')}</div>
        <div>{changedShare < 1e-4 ? '< 0.01%' : (changedShare * 100).toFixed(2)}</div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">
          <RequestFeeLabel />
        </div>
        <div>
          <HumanizeBalance asset={requestFee} value={requestFee.balance} /> LP Token
        </div>
      </SpaceBetweenRow>

      <OperationConfirmModal
        visible={confirming}
        onOk={() => Promise.resolve()}
        onCancel={() => setConfirming(false)}
        operation={<Text strong>{i18n.t('Add Liquidity')}</Text>}
      >
        <div className="label">{i18n.t('Add')}</div>
        <AssetBalanceList assets={assets} style={{ fontWeight: 'bold' }} />
        <DownOutlined style={{ margin: '16px 8px' }} />
        <div className="label">{i18n.t('Receive')}</div>
        <SpaceBetweenRow style={{ fontWeight: 'bold' }}>
          {/*TODO*/}
          <div>0</div>
          <div>
            <PoolAssetSymbol assets={assets} />
          </div>
        </SpaceBetweenRow>

        <SpaceBetweenRow>
          <TransactionFeeLabel />
          {/* TODO: calc tx fee*/}
          <HumanizeBalance asset={{ symbol: 'CKB', decimals: 8 }} value={0} showSuffix />
        </SpaceBetweenRow>
      </OperationConfirmModal>

      <Button block type="primary" onClick={() => setConfirming(true)}>
        {i18n.t('Add Liquidity')}
      </Button>
    </>
  );
};
