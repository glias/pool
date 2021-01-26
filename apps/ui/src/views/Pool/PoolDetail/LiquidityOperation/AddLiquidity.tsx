import { ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { AssetWithBalance, LiquidityInfo, price } from '@gliaswap/commons';
import { Typography } from 'antd';
import BigNumber from 'bignumber.js';
import { AssetBalanceList, AssetBaseQuotePrices, AssetSymbol, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { SpaceBetweenRow } from 'components/Layout';
import { useGliaswapAssets } from 'contexts';
import { Formik, FormikProps } from 'formik';
import { Form, Input, SubmitButton } from 'formik-antd';
import i18n from 'i18n';
import { zip } from 'lodash';
import React, { useState } from 'react';
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
    right: 0px;
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
  const [changedShare, setChangedShare] = useState<number | undefined>(undefined);
  const liquidityAssets = props.poolLiquidity.assets;
  const [liquidityAsset1, liquidityAsset2] = liquidityAssets;

  const [addedLiquidates, setAddedLiquidates] = useState<[BalanceWithoutDecimal, BalanceWithoutDecimal]>([
    BalanceWithoutDecimal.from(0, liquidityAsset1.decimals),
    BalanceWithoutDecimal.from(0, liquidityAsset2.decimals),
  ]);

  const { ckbAssets } = useGliaswapAssets();

  const userAsset1 = ckbAssets.find((asset) => asset.typeHash === liquidityAsset1.typeHash);
  const userAsset2 = ckbAssets.find((asset) => asset.typeHash === liquidityAsset2.typeHash);

  function onAmountInputChanged(
    form: FormikProps<InputFields>,
    inputFieldName: 'amount1' | 'amount2',
    inputAmount: string,
    inputLiquidityAsset: AssetWithBalance,
  ) {
    const anotherKey = inputFieldName === 'amount1' ? 'amount2' : 'amount1';
    const anotherLiquidityAsset = inputLiquidityAsset === liquidityAsset1 ? liquidityAsset2 : liquidityAsset1;
    setChangedShare(undefined);

    const input = BalanceWithDecimal.from(inputAmount, inputLiquidityAsset.decimals);

    if (!input.value.gte(0)) {
      form.setValues({ amount1: '', amount2: '' });
      return;
    }

    setChangedShare(input.withoutDecimal().value.div(inputLiquidityAsset.balance).toNumber());

    const anotherAmount = BalanceWithoutDecimal.from(
      price.getAddLiquidityPairedAssetPayAmount(
        input.withoutDecimal().value,
        new BigNumber(inputLiquidityAsset.balance),
        new BigNumber(anotherLiquidityAsset.balance),
      ),
      anotherLiquidityAsset.decimals,
    );

    form.setTouched({ [anotherKey]: true });
    form.setFieldValue(anotherKey, anotherAmount.withDecimal().toHumanize(), true);
  }

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

  return (
    <AddLiquidityWrapper>
      <Formik<InputFields>
        initialValues={{ amount1: '', amount2: '' }}
        validateOnChange={true}
        isInitialValid={false}
        initialTouched={{ amount1: true, amount2: true }}
        validate={validate}
        onSubmit={(v, actions) => {
          setAddedLiquidates([
            BalanceWithDecimal.from(v.amount1, liquidityAsset1.decimals).withoutDecimal(),
            BalanceWithDecimal.from(v.amount2, liquidityAsset2.decimals).withoutDecimal(),
          ]);
          actions.setSubmitting(false);
          setConfirming(true);
        }}
      >
        {(form) => (
          <Form layout="vertical">
            <Form.Item name="amount1" label={i18n.t('Asset 1')}>
              <div className="label-max">
                <HumanizeBalance asset={liquidityAsset1} value={userAsset1?.balance ?? '0'} />
              </div>
              <Input
                size="large"
                bordered={false}
                name="amount1"
                placeholder="0.0"
                onChange={(e) => onAmountInputChanged(form, 'amount1', e.target.value, liquidityAsset1)}
                suffix={<AssetSymbol asset={liquidityAsset1} />}
              />
            </Form.Item>
            <PlusOutlined className="plus-icon" />
            <Form.Item name="amount2" label={i18n.t('Asset 2')}>
              <div className="label-max">
                <HumanizeBalance asset={liquidityAsset1} value={userAsset2?.balance ?? '0'} />
              </div>
              <Input
                size="large"
                bordered={false}
                name="amount2"
                placeholder="0.0"
                onChange={(e) => onAmountInputChanged(form, 'amount2', e.target.value, liquidityAsset2)}
                suffix={<AssetSymbol asset={liquidityAsset2} />}
              />
            </Form.Item>

            <SpaceBetweenRow>
              <div className="label">{i18n.t('Price')}</div>
              <div>
                <AssetBaseQuotePrices
                  assets={liquidityAssets}
                  prices={[liquidityAsset1.balance, liquidityAsset2.balance]}
                />
              </div>
            </SpaceBetweenRow>
            <SpaceBetweenRow>
              <div className="label">{i18n.t('Add Pool Share')}</div>
              <div>
                {!changedShare ? '-' : changedShare < 1e-4 ? '< 0.01%' : (changedShare * 100).toFixed(2) + ' %'}
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
              block
              type="primary"
              disabled={!form.isValid || (!form.touched.amount1 && !form.touched.amount2)}
            >
              {i18n.t('Add Liquidity')}
            </SubmitButton>
          </Form>
        )}
      </Formik>

      <OperationConfirmModal
        visible={confirming}
        onOk={() => Promise.resolve()}
        onCancel={() => setConfirming(false)}
        operation={<Text strong>{i18n.t('Add Liquidity')}</Text>}
      >
        <div className="label">{i18n.t('Add')}</div>
        <AssetBalanceList
          assets={zip(liquidityAssets, addedLiquidates).map(([asset, added]) =>
            createAssetWithBalance(asset!, added!.value),
          )}
          style={{ fontWeight: 'bold' }}
        />
        <ArrowDownOutlined style={{ margin: '16px' }} />
        <div className="label">{i18n.t('Receive(EST)')}</div>
        <SpaceBetweenRow style={{ fontWeight: 'bold' }}>
          <div>
            <HumanizeBalance
              asset={liquidityAsset1}
              value={price.getAddLiquidityReceiveLPAmount(
                addedLiquidates[0].value,
                BalanceWithoutDecimal.fromAssetWithBalance(liquidityAsset1).value,
                BalanceWithoutDecimal.fromAssetWithBalance(props.poolLiquidity.lpToken).value,
              )}
            />
          </div>
          <div>
            <PoolAssetSymbol assets={liquidityAssets} />
          </div>
        </SpaceBetweenRow>

        <SpaceBetweenRow>
          <TransactionFeeLabel />
          <HumanizeBalance asset={{ symbol: 'CKB', decimals: 8 }} value={0} showSuffix />
        </SpaceBetweenRow>
      </OperationConfirmModal>
    </AddLiquidityWrapper>
  );
};
