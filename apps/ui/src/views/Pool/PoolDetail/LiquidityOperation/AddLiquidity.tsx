import { PlusOutlined } from '@ant-design/icons';
import { Asset, AssetWithBalance, isCkbNativeAsset, LiquidityInfo } from '@gliaswap/commons';
import { Typography } from 'antd';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { AssetBalanceList, AssetPrice, AssetSymbol, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { SpaceBetweenRow } from 'components/Layout';
import { TableRow } from 'components/TableRow';
import { Formik, FormikConfig, FormikProps } from 'formik';
import { Form, Input, SubmitButton } from 'formik-antd';
import { useAddLiquidity } from 'hooks/useAddLiquidity';
import i18n from 'i18n';
import { zip } from 'lodash';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Amount, createAssetWithBalance } from 'suite';
import { OperationConfirmModal } from './OperationConfirmModal';
import { LiquidityPoolTokenTooltip } from './components/LiquidityPoolTokenLabel';
import { TransactionFeeLabel } from './components/TransactionFeeLabel';

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
    margin-bottom: 16px;
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
  const poolLiquidity = props.poolLiquidity;
  const poolAssets = poolLiquidity.assets;
  const [poolAsset1, poolAsset2] = poolAssets;
  const [confirming, setConfirming] = useState(false);

  const {
    generateAddLiquidityTransaction,
    userFreeBalances,
    onUserInputReadyToAddAmount,
    readyToAddShare,
    readyToReceiveLPAmount,
    readyToAddAmounts,
    sendReadyToAddLiquidityTransaction,
    readyToAddLiquidityTransaction,
  } = useAddLiquidity();

  const onSubmit: FormikConfig<InputFields>['onSubmit'] = async (v, actions) => {
    if (!readyToAddAmounts) return;
    actions.setSubmitting(true);

    await generateAddLiquidityTransaction();

    actions.setSubmitting(false);
    setConfirming(true);
  };

  function validateAmount(input: string, userBalance: Amount, asset: AssetWithBalance): string | undefined {
    if (!input || !/^\d*(\.\d*)?$/.test(input)) return i18n.t(`Please fill in a valid number`);

    const inputAmount = Amount.fromHumanize(input, asset.decimals);

    if (inputAmount.value.isNaN() || inputAmount.value.lte(0)) return i18n.t(`Please fill in a valid number`);
    if (inputAmount.withDecimal().decimalPlaces() > asset.decimals) {
      return i18n.t(`The value exceeds the maximum precision {{decimals}} of the {{symbol}}`, {
        decimals: asset.decimals,
        symbol: asset.symbol,
      });
    }

    if (inputAmount.value.gt(userBalance.value)) {
      return i18n.t(`The value should be less than {{value}}`, { value: userBalance.toHumanize() });
    }
  }

  function validate({ amount1, amount2 }: InputFields) {
    if (!userFreeBalances) return { amount1: 'User balance is not loaded' };
    const [userBalance1, userBalance2] = userFreeBalances;

    if (!userBalance1) return { amount1: `Cannot find ${poolAsset1.symbol}` };
    if (!userBalance2) return { amount2: `Cannot find ${poolAsset2.symbol}` };

    const amount1ErrorMessage = validateAmount(amount1, userBalance1, poolAssets[0]);
    const amount2ErrorMessage = validateAmount(amount2, userBalance2, poolAssets[1]);

    if (!amount1ErrorMessage && !amount2ErrorMessage) return;

    return {
      amount1: amount1ErrorMessage,
      amount2: amount2ErrorMessage,
    };
  }

  function onAsset1Changed(val: string, form: FormikProps<InputFields>) {
    if (!val) {
      onUserInputReadyToAddAmount(val, 0);
      return form.setValues({ amount1: '', amount2: '' });
    }
    if (!/^\d*(\.\d*)?$/.test(val)) return form.setFieldValue('amount1', val.slice(0, -1));

    const readyToAddAmount = onUserInputReadyToAddAmount(val, 0);
    const amount1 = val;
    const amount2 = readyToAddAmount?.[1] ? readyToAddAmount[1].toHumanizeWithMaxDecimal() : form.values.amount2;
    form.setValues({ amount1, amount2 }, true);
    setImmediate(() => form.setTouched({ amount1: true, amount2: true }));
  }

  function onAsset2Changed(val: string, form: FormikProps<InputFields>) {
    if (!val) {
      onUserInputReadyToAddAmount(val, 1);
      return form.setValues({ amount1: '', amount2: '' });
    }
    if (!/^\d*(\.\d*)?$/.test(val)) return form.setFieldValue('amount2', val.slice(0, -1));

    const readyToAddAmount = onUserInputReadyToAddAmount(val, 1);
    const amount1 = readyToAddAmount?.[0] ? readyToAddAmount[0].toHumanizeWithMaxDecimal() : form.values.amount1;
    const amount2 = val;
    form.setValues({ amount1, amount2 }, true);
    setImmediate(() => form.setTouched({ amount1: true, amount2: true }));
  }

  function shouldShowMaxLabel(asset: Asset, userFreeBalance?: Amount): userFreeBalance is Amount {
    if (!userFreeBalance) return false;
    if (isCkbNativeAsset(asset)) return userFreeBalance.value.gt(10 ** 8);
    return userFreeBalance.value.gt(0);
  }

  const readyToAddShareEl = useMemo(() => {
    if (!readyToAddShare) return '-';
    if (readyToAddShare < 0.0001) return '< 0.01 %';
    return (readyToAddShare * 100).toFixed(2) + ' %';
  }, [readyToAddShare]);

  return (
    <AddLiquidityWrapper>
      <Formik<InputFields> onSubmit={onSubmit} initialValues={{ amount1: '', amount2: '' }} validate={validate}>
        {(form) => (
          <Form layout="vertical">
            <Form.Item name="amount1" label={i18n.t('Asset 1')}>
              {shouldShowMaxLabel(poolAsset1, userFreeBalances?.[0]) && (
                <div
                  className="label-max"
                  onClick={() =>
                    // asset 1 is ckb, so reduce 0.1 ckb first to ensure sufficient transaction fee
                    onAsset1Changed(
                      userFreeBalances![0].newValue((val) => val.minus(10 ** 8)).toHumanizeWithMaxDecimal(),
                      form,
                    )
                  }
                >
                  <HumanizeBalance
                    asset={poolAsset1}
                    value={userFreeBalances![0].newValue((val) => val.minus(10 ** 8)).value}
                  />
                </div>
              )}
              <Input
                autoComplete="off"
                size="large"
                bordered={false}
                name="amount1"
                placeholder="0.0"
                value={form.values.amount1}
                onChange={(e) => onAsset1Changed(e.target.value, form)}
                suffix={<AssetSymbol asset={poolAsset1} />}
              />
            </Form.Item>
            <PlusOutlined className="plus-icon" />
            <Form.Item name="amount2" label={i18n.t('Asset 2')}>
              {shouldShowMaxLabel(poolAsset2, userFreeBalances?.[1]) && (
                <div
                  className="label-max"
                  onClick={() => onAsset2Changed(userFreeBalances![1].toHumanizeWithMaxDecimal(), form)}
                >
                  <HumanizeBalance asset={poolAsset2} value={userFreeBalances![1]} />
                </div>
              )}
              <Input
                autoComplete="off"
                size="large"
                bordered={false}
                name="amount2"
                placeholder="0.0"
                onChange={(e) => onAsset2Changed(e.target.value, form)}
                value={form.values.amount2}
                suffix={<AssetSymbol asset={poolAsset2} />}
              />
            </Form.Item>

            <TableRow label={i18n.t('Price')}>
              <AssetPrice assets={poolAssets} />
            </TableRow>
            <TableRow label={i18n.t('Add Pool Share')}>{readyToAddShareEl}</TableRow>
            <TableRow
              label={i18n.t('Request fee')}
              labelTooltip={i18n.t('This fee goes to deal-miners as the incentives.')}
            >
              {<b>{i18n.t('Free Now')}</b>}
            </TableRow>
            <SubmitButton
              style={{ marginTop: '24px' }}
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
        onOk={() => sendReadyToAddLiquidityTransaction()}
        onCancel={() => setConfirming(false)}
        operation={<Text strong>{i18n.t('Add Liquidity')}</Text>}
      >
        {confirming && (
          <>
            <div className="label">{i18n.t('Add')}</div>
            {readyToAddAmounts && (
              <AssetBalanceList
                assets={zip(poolAssets, readyToAddAmounts).map(([asset, added]) =>
                  createAssetWithBalance(asset!, added!.value),
                )}
              />
            )}
            <div style={{ padding: '8px 0' }}>
              <DownArrowSvg />
            </div>
            <div className="label">
              <LiquidityPoolTokenTooltip>{i18n.t('Receive(EST.)')}</LiquidityPoolTokenTooltip>
            </div>
            <SpaceBetweenRow style={{ fontWeight: 'bold' }}>
              <div>
                <HumanizeBalance asset={poolLiquidity.lpToken} value={readyToReceiveLPAmount} />
              </div>
              <div>
                <PoolAssetSymbol assets={poolAssets} />
              </div>
            </SpaceBetweenRow>

            <SpaceBetweenRow>
              <TransactionFeeLabel />
              <HumanizeBalance
                asset={{ symbol: 'CKB', decimals: 8 }}
                value={readyToAddLiquidityTransaction?.fee}
                maxToFormat={8}
                showSuffix
              />
            </SpaceBetweenRow>
          </>
        )}
      </OperationConfirmModal>
    </AddLiquidityWrapper>
  );
};
