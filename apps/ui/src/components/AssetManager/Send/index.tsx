import { isCkbNativeAsset } from '@gliaswap/commons';
import { Address, AddressType, Amount } from '@lay2/pw-core';
import { Button, Divider, Form, Input } from 'antd';
import { FormItemProps } from 'antd/lib/form';
import { BigNumber } from 'bignumber.js';
import { AssetManagerHeader } from 'components/AssetManager/AssetManagerHeader';
import { asserts, debounce } from 'components/AssetManager/helper';
import { useAssetManager } from 'components/AssetManager/hooks';
import { AssetSelector } from 'components/AssetSelector';
import { HumanizeBalance } from 'components/Balance';
import i18n from 'i18n';
import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { CKB_MIN_CHANGE_CKB } from 'suite/constants';

const SendWrapper = styled.div`
  padding: 16px 24px;

  .ant-form,
  .ant-form-item-label > label {
    color: #000;
  }

  .send-header {
    text-align: center;
    padding: 16px;
  }

  .ant-input {
    background: #f6f6f6;
    height: 34px;
    padding: 10px;
  }

  .ant-form-item-control {
    padding: 0 14px;
  }

  .ant-input-affix-wrapper {
    background: #f6f6f6;
    border-radius: 16px;
  }

  textarea {
    border-radius: 16px;
  }

  /* Chrome, Safari, Edge, Opera */

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */

  input[type='number'] {
    -moz-appearance: textfield;
  }

  // rewrite the SelectToken style
  .current {
    margin-top: 0;
  }

  .select-token {
    cursor: pointer;

    .anticon-caret-down {
      position: relative;
      top: 5px;
      float: right;
    }
  }
`;

const AmountControlLabelWrapper = styled.div`
  padding-bottom: 8px;

  .amount,
  .balance-value,
  .balance-decimals {
    color: #5c61da;
  }

  .amount {
    float: right;
    cursor: pointer;
    border-bottom: 1px solid #5c61da;
    position: relative;
    top: 4px;
    line-height: 1;
  }
`;

export const Send: React.FC = () => {
  const [form] = Form.useForm<{ amount: string; to: string }>();
  const { push, replace } = useHistory();
  const match = useRouteMatch();
  const { currentAsset, assets } = useAssetManager();

  const [shouldSendAllCkb, setShouldSendAllCkb] = useState(false);
  const freeAmount: BigNumber = useMemo(() => new BigNumber(currentAsset.balance), [currentAsset.balance]);

  const maxPayableAmount: BigNumber = freeAmount;
  const decimal = currentAsset.decimals;

  const [inputAllValidated, setInputAllValidated] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedValidateInput = useCallback(
    debounce(async () => {
      await form.validateFields(['amount', 'to']);

      setInputAllValidated(true);
    }, 200),
    [form, setInputAllValidated],
  );

  const { data: transactionFee } = useQuery<string, unknown>(
    ['getTransactionFee', currentAsset, inputAllValidated, form.getFieldValue('amount')],
    async () => {
      // const { to } = form.getFieldsValue(['amount', 'to']);
      if (!inputAllValidated) return '';
      // const toAddressType = to.startsWith('ck') ? AddressType.ckb : AddressType.eth;
      // const toAddress = new Address(to, toAddressType);

      if (isCkbNativeAsset(currentAsset)) {
        // const builder = new ForceSimpleBuilder(toAddress, new Amount(amount, decimal));
        // await builder.build();
        //
        // return builder.getFee().toString();
        return '0';
      }
      // const builder = new SimpleSUDTBuilder(sudt, toAddress, new Amount(amount, decimal));
      // await builder.build();
      // return builder.getFee().toString();
      return '0';
    },
    { enabled: inputAllValidated },
  );

  const validateInput = useCallback(
    async function validateInput() {
      setInputAllValidated(false);
      debouncedValidateInput();
    },
    [debouncedValidateInput],
  );

  const validateAmount = useCallback(
    async function validateAmount(_: any, input: any): Promise<void> {
      setShouldSendAllCkb(false);
      const isCkb = isCkbNativeAsset(currentAsset);

      const inputNumber = new BigNumber(input);
      asserts(input && !inputNumber.isNaN(), i18n.t(`Amount should be a valid number`));

      const balance = freeAmount;
      asserts(inputNumber.lte(balance), i18n.t('Amount should be less than the MAX'));
      asserts(inputNumber.gt(0), i18n.t('Amount should be more than 0'));
      if (!isCkb) return;

      asserts(inputNumber.decimalPlaces() <= decimal, i18n.t(`The value up to ${decimal} precision`));
      asserts(inputNumber.gte(61), i18n.t('Amount should be large than 61'));
      const remainLessThanBasicCellCapacity = balance.minus(inputNumber).lt(61);
      setShouldSendAllCkb(remainLessThanBasicCellCapacity);
    },
    [currentAsset, decimal, freeAmount],
  );

  async function validateAddress(_: any, input: string): Promise<void> {
    asserts(
      input && new Address(input, input.startsWith('ck') ? AddressType.ckb : AddressType.eth).valid(),
      i18n.t('Please input a valid address'),
    );
  }

  const setAllBalanceToAmount = useCallback(
    function setAllBalanceToAmount() {
      form.setFieldsValue({ amount: maxPayableAmount.toString() });
      validateInput();
    },
    [form, maxPayableAmount, validateInput],
  );

  const amountLabel = useMemo(
    () => (
      <AmountControlLabelWrapper>
        <span>{i18n.t('Amount')}</span>
        <span
          tabIndex={0}
          role="button"
          className="amount"
          onClick={setAllBalanceToAmount}
          onKeyDown={setAllBalanceToAmount}
        >
          {i18n.t('MAX')}
          :&nbsp;
          <HumanizeBalance asset={currentAsset} value={maxPayableAmount} />
        </span>
      </AmountControlLabelWrapper>
    ),
    [currentAsset, maxPayableAmount, setAllBalanceToAmount],
  );

  const transactionFeeTip = useMemo(
    () => (
      <div style={{ marginBottom: '16px' }}>
        <div>{i18n.t('Transaction fee')}</div>
        <div>
          {transactionFee ? <HumanizeBalance asset={currentAsset} value={transactionFee} maxToFormat={8} /> : '-'}
        </div>
      </div>
    ),
    [currentAsset, transactionFee],
  );

  const onFinish = useCallback(
    function onFinish(data: { to: string; amount: string }) {
      const { to, amount: inputAmount } = data;

      const amount = new Amount(inputAmount, decimal).toString(0);
      const confirmUrl = `${match.url}/confirm?to=${to}&amount=${amount}&fee=${transactionFee}`;
      push(confirmUrl);
    },
    [decimal, match.url, push, transactionFee],
  );

  const amountFormItemProps: FormItemProps = useMemo(() => {
    return shouldSendAllCkb
      ? {
          validateStatus: 'warning',
          help: i18n.t(
            `The remaining balance is too small(less than 61 CKB). So the transaction won't succeed. You can send less than {{lessRemain}} CKB out. \n Or do you want to send ALL your CKB out?`,
            { lessRemain: freeAmount.minus(CKB_MIN_CHANGE_CKB) },
          ),
        }
      : {};
  }, [freeAmount, shouldSendAllCkb]);

  async function onAssetSelected(typeHash: string) {
    replace(`/assets/${typeHash}/send`);
  }

  return (
    <>
      <AssetManagerHeader title={i18n.t('Send')} showGoBack />
      <SendWrapper>
        <Form form={form} onValuesChange={validateInput} autoComplete="off" layout="vertical" onFinish={onFinish}>
          <Form.Item label={i18n.t('Token')}>
            <AssetSelector
              renderKey={(asset) => asset.typeHash}
              assets={assets}
              selectedKey={currentAsset.typeHash}
              onSelected={onAssetSelected}
            />
          </Form.Item>
          <Form.Item
            label={i18n.t('To')}
            name="to"
            rules={[{ validator: validateAddress, validateTrigger: ['onChange', 'onBlur'] }]}
          >
            <Input.TextArea rows={4} placeholder={i18n.t('To')} />
          </Form.Item>
          {amountLabel}
          <Form.Item
            {...amountFormItemProps}
            rules={[{ validator: validateAmount, validateTrigger: ['onChange', 'onBlur'] }]}
            name="amount"
          >
            <Input suffix={currentAsset.symbol} placeholder={i18n.t('Amount')} type="number" size="large" />
          </Form.Item>
          <Divider />
          {transactionFeeTip}

          <Form.Item>
            <Button htmlType="submit" size="large" block disabled={!inputAllValidated || !transactionFee}>
              {shouldSendAllCkb ? i18n.t('Send All My CKB') : i18n.t('Send')}
            </Button>
          </Form.Item>
        </Form>
      </SendWrapper>
    </>
  );
};
