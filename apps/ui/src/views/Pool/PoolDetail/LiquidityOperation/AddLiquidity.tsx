import { ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { AssetWithBalance, isCkbNativeAsset, LiquidityInfo } from '@gliaswap/commons';
import { Typography } from 'antd';
import { AssetBalanceList, AssetBaseQuotePrices, AssetSymbol, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { SpaceBetweenRow } from 'components/Layout';
import { Formik, FormikProps } from 'formik';
import { Form, Input, SubmitButton } from 'formik-antd';
import { useAddLiquidity } from 'hooks/useAddLiquidity';
import i18n from 'i18n';
import { zip } from 'lodash';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';
import { assetBalanceToInput, BalanceWithDecimal, BalanceWithoutDecimal, createAssetWithBalance } from 'suite';
import { RequestFeeLabel } from './components/RequestFeeLabel';
import { TransactionFeeLabel } from './components/TransactionFeeLabel';
import { OperationConfirmModal } from './OperationConfirmModal';

const { Text } = Typography;

interface AddLiquidityProps {
  poolLiquidity: LiquidityInfo;
}

interface InputFields {
  amount1: string;
  amount2: string;
}

const AddLiquidityWrapper = styled.div`
  font-weight: bold;

  .ant-form-item {
    padding: 12px;
    border: 1px solid #e1e1e1;
    border-radius: 16px;
  }

  .plus-icon {
    display: block;
    margin: 16px auto;
  }

  .ant-form-item-explain {
    font-weight: normal;
  }

  .ant-input-affix-wrapper {
    padding: 8px 0 0;
  }

  .ant-form-item-label {
    padding-bottom: 0;
  }

  .ant-form-item-label > label,
  .label-max {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.85);
    opacity: 0.77;
  }

  .label-max {
    position: absolute;
    top: -17px;
    font-weight: normal;
    right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.85);
    line-height: 1;
    cursor: pointer;

    &:before {
      content: 'Max: ';
    }
  }
`;

export const AddLiquidity: React.FC<AddLiquidityProps> = (props) => {
  const [confirming, setConfirming] = useState(false);
  const poolAssets = props.poolLiquidity.assets;
  const [liquidityAsset1, liquidityAsset2] = poolAssets;

  const {
    generateAddLiquidityTransaction,
    userFreeAssets,
    onUserInputReadyToAddLiquidity,
    readyToAddShare,
    readyToAddLiquidity,
    sendReadyToAddLiquidityTransaction,
  } = useAddLiquidity();
  const [userAsset1, userAsset2] = userFreeAssets;

  const { isLoading, mutateAsync: sendAddLiquidityTransaction } = useMutation(
    'sendReadyToAddLiquidityTransaction',
    async () => {
      const txHash = await sendReadyToAddLiquidityTransaction();
      setConfirming(false);
      return txHash;
    },
  );

  function validateAmount(balance: BalanceWithDecimal, asset: AssetWithBalance): string | undefined {
    const balanceWithDecimals = balance.value;

    if (balanceWithDecimals.isNaN() || balanceWithDecimals.lte(0)) {
      return 'Please fill in a valid number';
    }
    if (balanceWithDecimals.decimalPlaces() > asset.decimals) {
      return `The value exceeds the maximum precision ${asset.decimals} of the ${asset.symbol}`;
    }
    if (balance.withoutDecimal().value.gt(asset.balance)) {
      return i18n.t(`The value should be less than MAX {{value}}`, {
        value: assetBalanceToInput(asset.balance, asset, 4),
      });
    }
  }

  function validate({ amount1, amount2 }: InputFields) {
    if (!amount1 || !amount2) return;
    if (!userAsset1) return { amount1: `Cannot find ${liquidityAsset1.symbol}` };
    if (!userAsset2) return { amount2: `Cannot find ${liquidityAsset2.symbol}` };

    const amount1ErrorMessage = validateAmount(BalanceWithDecimal.from(amount1, liquidityAsset1.decimals), userAsset1);
    const amount2ErrorMessage = validateAmount(BalanceWithDecimal.from(amount2, liquidityAsset2.decimals), userAsset2);

    if (!amount1ErrorMessage && !amount2ErrorMessage) return;

    return {
      amount1: amount1ErrorMessage,
      amount2: amount2ErrorMessage,
    };
  }

  function onAsset1Changed(val: string, form: FormikProps<InputFields>) {
    if (!val) return form.setValues({ amount1: '', amount2: '' });
    if (!/^\d*(\.\d*)?$/.test(val)) return form.setFieldValue('amount1', val.slice(0, -1));

    const [, balance2] = onUserInputReadyToAddLiquidity(val, 0);
    form.setValues({ amount1: val, amount2: balance2.withDecimal().toHumanize() });
  }

  function onAsset2Changed(val: string, form: FormikProps<InputFields>) {
    if (!val) form.setValues({ amount1: '', amount2: '' });
    if (!/\d+(\.\d*)?/.test(val)) return form.setFieldValue('amount2', val.slice(0, -1));

    const [balance1] = onUserInputReadyToAddLiquidity(val, 1);
    form.setValues({ amount1: balance1.withDecimal().toHumanize(), amount2: val }, true);
  }

  function calcMaxAvailableBalance(assetWithBalance: AssetWithBalance): string {
    return (
      BalanceWithoutDecimal.fromAsset(assetWithBalance)
        // minus 0.1 ckb as the transaction fee
        .newValue((val) => (isCkbNativeAsset(assetWithBalance) ? val.minus(10 ** assetWithBalance.decimals) : val))
        .withDecimal()
        .toHumanize(assetWithBalance.decimals)
    );
  }

  return (
    <AddLiquidityWrapper>
      <Formik<InputFields>
        initialValues={{ amount1: '', amount2: '' }}
        isInitialValid={false}
        initialTouched={{ amount1: true, amount2: true }}
        validate={validate}
        onSubmit={async (v, actions) => {
          if (!readyToAddLiquidity) return;
          actions.setSubmitting(true);

          await generateAddLiquidityTransaction();

          actions.setSubmitting(false);
          setConfirming(true);
        }}
      >
        {(form) => (
          <Form layout="vertical">
            <Form.Item name="amount1" label={i18n.t('Asset 1')}>
              <div className="label-max">
                <HumanizeBalance
                  onClick={() => onAsset1Changed(calcMaxAvailableBalance(userAsset1), form)}
                  asset={liquidityAsset1}
                  value={userAsset1?.balance ?? '0'}
                />
              </div>
              <Input
                autoComplete="off"
                size="large"
                bordered={false}
                name="amount1"
                placeholder="0.0"
                value={form.values.amount1}
                onChange={(e) => onAsset1Changed(e.target.value, form)}
                suffix={<AssetSymbol asset={liquidityAsset1} />}
              />
            </Form.Item>
            <PlusOutlined className="plus-icon" />
            <Form.Item name="amount2" label={i18n.t('Asset 2')}>
              <div className="label-max">
                <HumanizeBalance
                  onClick={() => onAsset2Changed(calcMaxAvailableBalance(userAsset2), form)}
                  asset={userAsset2}
                />
              </div>
              <Input
                autoComplete="off"
                size="large"
                bordered={false}
                name="amount2"
                placeholder="0.0"
                onChange={(e) => onAsset2Changed(e.target.value, form)}
                suffix={<AssetSymbol asset={liquidityAsset2} />}
              />
            </Form.Item>

            <SpaceBetweenRow>
              <div className="label">{i18n.t('Price')}</div>
              <div>
                <AssetBaseQuotePrices assets={poolAssets} />
              </div>
            </SpaceBetweenRow>
            <SpaceBetweenRow>
              <div className="label">{i18n.t('Add Pool Share')}</div>
              <div>
                {!readyToAddShare
                  ? '-'
                  : readyToAddShare < 1e-4
                  ? '< 0.01%'
                  : (readyToAddShare * 100).toFixed(2) + ' %'}
              </div>
            </SpaceBetweenRow>
            <SpaceBetweenRow>
              <div className="label">
                <RequestFeeLabel />
              </div>
              <div>
                <b>Free now</b>
              </div>
            </SpaceBetweenRow>

            <SubmitButton
              style={{ marginTop: '32px' }}
              block
              type="primary"
              disabled={!form.isValid || !form.values.amount1 || !form.values.amount2}
            >
              {i18n.t('Add Liquidity')}
            </SubmitButton>
          </Form>
        )}
      </Formik>

      <OperationConfirmModal
        visible={confirming}
        onOk={() => sendAddLiquidityTransaction()}
        onCancel={() => !isLoading && setConfirming(false)}
        operation={<Text strong>{i18n.t('Add Liquidity')}</Text>}
      >
        <div className="label">{i18n.t('Add')}</div>
        {readyToAddLiquidity && (
          <AssetBalanceList
            assets={zip(poolAssets, readyToAddLiquidity).map(([asset, added]) =>
              createAssetWithBalance(asset!, added!.value),
            )}
            style={{ fontWeight: 'bold' }}
          />
        )}
        <ArrowDownOutlined style={{ margin: '16px' }} />
        <div className="label">{i18n.t('Receive(EST)')}</div>
        <SpaceBetweenRow style={{ fontWeight: 'bold' }}>
          <div>
            <HumanizeBalance asset={liquidityAsset1} value={readyToAddShare} />
          </div>
          <div>
            <PoolAssetSymbol assets={poolAssets} />
          </div>
        </SpaceBetweenRow>

        <SpaceBetweenRow>
          <TransactionFeeLabel />
          <HumanizeBalance asset={{ symbol: 'CKB', decimals: 8 }} value={0} maxToFormat={8} showSuffix />
        </SpaceBetweenRow>
      </OperationConfirmModal>
    </AddLiquidityWrapper>
  );
};
