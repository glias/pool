import { PlusOutlined } from '@ant-design/icons';
import { AssetWithBalance, CkbAssetWithBalance, CkbModel, Models } from '@gliaswap/commons';
import { Button, Col, Divider, Form, Input, Row, Select, Typography } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset';
import { AssetSelector } from 'components/AssetSelector';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { FormikProps, useFormik } from 'formik';
import { useGliaswapAssets } from 'hooks';
import { useAddLiquidity } from 'hooks/useAddLiquidity';
import i18n from 'i18n';
import { zip } from 'lodash';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Amount, createAssetWithBalance } from 'suite';
import { OperationConfirmModal } from '../PoolDetail/LiquidityOperation/OperationConfirmModal';
import { LiquidityPoolTokenTooltip } from '../PoolDetail/LiquidityOperation/components/LiquidityPoolTokenLabel';
import { TransactionFeeLabel } from '../PoolDetail/LiquidityOperation/components/TransactionFeeLabel';
import { useCreatePool } from './useCreatePool';

const Text = Typography.Text;

const CreatePoolWrapper = styled.div`

  .ant-form {
    font-weight: bold;
  }

  .ant-form-item {
    padding: 12px;
    border: 1px solid #e1e1e1;
    border-radius: 16px;
  }

  .ant-input-affix-wrapper-lg {
    font-size: 14px;
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
`;

interface InputFields {
  amount1: string;
  amount2: string;
}

const StepButton: React.FC<ButtonProps> = (props) => {
  const { icon, children, ...btnProps } = props;

  return (
    <Button.Group style={{ width: '100%' }}>
      {!btnProps.loading && <Button type="primary" icon={icon} {...btnProps} />}
      <Button block type="primary" {...btnProps}>
        {children}
      </Button>
    </Button.Group>
  );
};

export const CreatePool: React.FC = () => {
  const { selectedAssets, sendCreatePoolTransaction, setAssetWithIndex, poolWithStatus } = useCreatePool();
  const history = useHistory();
  const { ckbAssets } = useGliaswapAssets();
  const [confirming, setConfirming] = useState(false);

  const {
    poolQuery,
    generateAddLiquidityTransaction,
    sendReadyToAddLiquidityTransaction,
    readyToAddLiquidityTransaction,
    readyToAddAmounts,
    readyToReceiveLPAmount,
    onUserInputReadyToAddAmount,
    userFreeBalances,
  } = useAddLiquidity(poolWithStatus.status === 'created' ? poolWithStatus.pool.poolId : undefined);

  const { mutate: createPool, status: createStatus } = useMutation('createPool', sendCreatePoolTransaction);

  const form = useFormik<InputFields>({
    initialValues: { amount1: '', amount2: '' },
    onSubmit: async function genesisLiquidity(_fields, actions) {
      if (!readyToAddAmounts) return;
      actions.setSubmitting(true);

      await generateAddLiquidityTransaction();

      actions.setSubmitting(false);
      setConfirming(true);
    },
    validate({ amount1, amount2 }) {
      if (!userFreeBalances) return { amount1: 'User balance is not loaded' };
      if (!poolAssets) throw new Error('pool info is not loaded, please wait');

      // the order of the assets selected by the user is not always the same as the order of the assets in the pool
      // so we need to find the correct index first
      const [userBalance1, userBalance2] = selectedAssets.map(
        (selectedAsset) =>
          userFreeBalances[poolAssets.findIndex((poolAsset) => CkbModel.equals(selectedAsset, poolAsset))],
      );
      const [poolAsset1, poolAsset2] = selectedAssets;

      if (!userBalance1) return { amount1: `Cannot find ${poolAsset1.symbol}` };
      if (!userBalance2) return { amount2: `Cannot find ${poolAsset2.symbol}` };

      const amount1ErrorMessage = validateAmount(amount1, userBalance1, poolAsset1);
      const amount2ErrorMessage = validateAmount(amount2, userBalance2, poolAsset2);

      if (!amount1ErrorMessage && !amount2ErrorMessage) return;

      return {
        amount1: amount1ErrorMessage,
        amount2: amount2ErrorMessage,
      };
    },
  });

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

  const poolStatus = poolWithStatus.status;

  function onAssetSelected(asset: CkbAssetWithBalance, index: number) {
    setAssetWithIndex(asset, index);
    form.resetForm();
  }

  function redirectToPool() {
    if (poolWithStatus.status !== 'liquid') return;
    const poolId = poolWithStatus.pool.poolId;
    history.replace(`/pool/${poolId}`);
  }

  function onAmountInputChanged(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    if (!/^\d*(\.\d*)?$/.test(e.target.value)) return;

    form.handleChange(e);

    const selectedAsset = selectedAssets[index];
    const poolAssetIndex = poolAssets?.findIndex((asset) => CkbModel.equals(selectedAsset, asset));
    if (poolAssetIndex === undefined || poolAssetIndex === -1) {
      throw new Error(`cannot find the asset ${Models.get(selectedAsset)?.identity(selectedAsset)} in pool`);
    }

    onUserInputReadyToAddAmount(e.target.value, poolAssetIndex);
  }

  function renderAssetInput({
    form,
    name,
    index,
    onMaxLabelClicked,
    label,
  }: {
    name: string;
    label: React.ReactNode;
    form: FormikProps<any>;
    index: number;
    onMaxLabelClicked: () => void;
  }) {
    const selectedAsset = selectedAssets[index];
    const userAsset = ckbAssets.find((userAsset) => CkbModel.equals(userAsset, selectedAsset));

    const maxAvailable = (() => {
      if (!userAsset) return;
      const amount = Amount.fromAsset(userAsset);
      return amount.value.gt(10 ** 8) && CkbModel.isNativeAsset(userAsset)
        ? amount.newValue((val) => val.minus(10 ** 8))
        : amount;
    })();

    const maxLabel = userAsset && (
      <div className="label-max" onClick={onMaxLabelClicked}>
        <HumanizeBalance asset={userAsset} value={maxAvailable} />
      </div>
    );

    return (
      <Form.Item label={label} validateStatus={form.errors[name] && 'error'} help={form.errors[name]}>
        {maxLabel}
        <Input
          autoComplete="off"
          size="large"
          placeholder="0.0"
          bordered={false}
          name={name}
          value={form.values[name]}
          disabled={poolStatus !== 'created'}
          onChange={(e) => onAmountInputChanged(e, index)}
          suffix={
            <AssetSelector
              assets={ckbAssets}
              renderKey={CkbModel.identity}
              onSelected={(_, asset) => onAssetSelected(asset, index)}
              selectedKey={selectedAsset?.typeHash}
              disabledKeys={selectedAssets.map(CkbModel.identity)}
              enableSearch
              group={(asset) => asset.chainType}
            />
          }
        />
      </Form.Item>
    );
  }

  async function afterSendGenesisLiquiditySuccessful() {
    if (poolWithStatus.status !== 'created') throw new Error('the pool is not created');
    history.push(`/pool/${poolWithStatus.pool.poolId}`);
  }

  const pendingCreate = poolStatus === 'pending' || createStatus === 'loading';
  const pendingGenesisLiquidity = form.isSubmitting || confirming;
  const poolAssets = poolQuery.data?.assets;

  return (
    <CreatePoolWrapper>
      <Section>
        <strong>{i18n.t('You may be the first liquidity provider')}</strong>
        <p style={{ lineHeight: '16px' }}>
          {i18n.t(
            'Create the pool before adding liquidity. And the ratio of tokens you add will set the price of this pool.',
          )}
        </p>
      </Section>
      <Section>
        <strong>{i18n.t('Create Pool')}</strong>
        <Divider style={{ margin: 8 }} />
        <Form layout="vertical">
          <Form.Item label={i18n.t('Model')}>
            <Select defaultValue="UNISWAP" bordered={false}>
              <Select.Option value="UNISWAP">UNISWAP MODEL</Select.Option>
            </Select>
          </Form.Item>

          {renderAssetInput({
            form,
            index: 0,
            onMaxLabelClicked: console.log,
            name: 'amount1',
            label: i18n.t('Asset 1'),
          })}

          <PlusOutlined className="plus-icon" />

          {renderAssetInput({
            form,
            index: 1,
            onMaxLabelClicked: console.log,
            name: 'amount2',
            label: i18n.t('Asset 2'),
          })}

          {poolStatus === 'liquid' ? (
            <Button type="primary" block onClick={redirectToPool}>
              {i18n.t('To the pool')}
            </Button>
          ) : (
            <Row justify="space-between" gutter={16}>
              <Col span={12}>
                <StepButton
                  icon="1"
                  disabled={poolStatus !== 'uncreated'}
                  loading={pendingCreate}
                  onClick={() => createPool()}
                >
                  {i18n.t('Create Pool')}
                </StepButton>
              </Col>
              <Col span={12}>
                <StepButton
                  icon="2"
                  disabled={poolStatus !== 'created'}
                  loading={pendingGenesisLiquidity}
                  onClick={() => form.submitForm()}
                >
                  {i18n.t('Add Liquidity')}
                </StepButton>
              </Col>
            </Row>
          )}
        </Form>

        <OperationConfirmModal
          visible={confirming}
          onOk={() => sendReadyToAddLiquidityTransaction()}
          onCancel={() => setConfirming(false)}
          operation={<Text strong>{i18n.t('Add Liquidity')}</Text>}
          onSuccessfulDismiss={afterSendGenesisLiquiditySuccessful}
        >
          {confirming && poolAssets && poolQuery.data && (
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
                  <HumanizeBalance asset={poolQuery.data.lpToken} value={readyToReceiveLPAmount} />
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
      </Section>
    </CreatePoolWrapper>
  );
};
