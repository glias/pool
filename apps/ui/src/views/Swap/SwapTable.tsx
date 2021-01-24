import React from 'react';
import { Block } from 'components/Block';
import { ConfirmButton } from 'components/ConfirmButton';
import { Form } from 'antd';
import styled from 'styled-components';
import i18n from 'i18n';
import { InputNumber } from 'components/InputNumber';
import BigNumber from 'bignumber.js';
import { ReactComponent as SwapSvg } from 'asserts/svg/swap.svg';
import { useCallback } from 'react';
import { SwapMode, useSwapContainer } from './hook';
import { GliaswapAssetWithBalance } from '@gliaswap/commons';

const FormContainer = styled(Form)`
  .submit {
    margin-top: 32px;
    margin-bottom: 0;
  }
  .swap {
    text-align: center;
    margin-bottom: 16px;
    height: 22px;
  }
`;

export const SwapTable: React.FC = () => {
  const [form] = Form.useForm();
  const {
    setReviewModalVisable,
    swapMode,
    setPay,
    setReceive,
    setTokenA,
    tokenA,
    setTokenB,
    tokenB,
  } = useSwapContainer();

  const getBalance = useCallback(
    (field: string, asset: GliaswapAssetWithBalance) => {
      const val = form.getFieldValue(field);
      return new BigNumber(val).times(10 ** asset.decimals).toFixed(asset.decimals, BigNumber.ROUND_DOWN);
    },
    [form],
  );

  const onSubmit = useCallback(() => {
    const newTokenA: GliaswapAssetWithBalance = { ...tokenA, balance: getBalance('pay', tokenA) };
    const newTokenB: GliaswapAssetWithBalance = { ...tokenB, balance: getBalance('receive', tokenB) };
    setTokenA(newTokenA);
    setTokenB(newTokenB);
    setReviewModalVisable(true);
  }, [setReviewModalVisable, setTokenA, tokenA, setTokenB, tokenB, getBalance]);

  const payOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (swapMode === SwapMode.CrossIn) {
        setPay(e.target.value);
        form.setFieldsValue({ receive: val });
      } else if (swapMode === SwapMode.CrossOut) {
        setPay(e.target.value);
        form.setFieldsValue({ receive: new BigNumber(val).times(0.999) });
      }
    },
    [setPay, swapMode, form],
  );

  const receiveOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (swapMode === SwapMode.CrossIn) {
        setReceive(e.target.value);
        form.setFieldsValue({ pay: val });
      } else if (swapMode === SwapMode.CrossOut) {
        setReceive(e.target.value);
        form.setFieldsValue({ pay: new BigNumber(val).div(0.999) });
      }
    },
    [setReceive, swapMode, form],
  );

  return (
    <Block>
      <FormContainer form={form} layout="vertical">
        <InputNumber
          label={i18n.t('swap.order-table.you-pay')}
          name="pay"
          max="0.1"
          assets={[]}
          renderKeys={(_, i) => i}
          inputProps={{
            onChange: payOnChange,
          }}
          formItemProps={{
            rules: [
              {
                validator: (_, val: string) => {
                  if (new BigNumber(val).isLessThan(1)) {
                    return Promise.reject('some error');
                  }
                  return Promise.resolve();
                },
              },
            ],
          }}
        />
        <div className="swap">
          <SwapSvg />
        </div>
        <InputNumber
          label={i18n.t('swap.order-table.you-receive')}
          name="receive"
          max="0.1"
          assets={[]}
          inputProps={{
            onChange: receiveOnChange,
          }}
          renderKeys={(_, i) => i}
        />
        <Form.Item className="submit">
          <ConfirmButton text={i18n.t('swap.order-table.swap')} htmlType="submit" onClick={onSubmit} />
        </Form.Item>
      </FormContainer>
    </Block>
  );
};
