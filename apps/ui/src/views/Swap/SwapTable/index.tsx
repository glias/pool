import React from 'react';
import { Block } from 'components/Block';
import { ConfirmButton } from 'components/ConfirmButton';
import { Form, Modal } from 'antd';
import styled from 'styled-components';
import i18n from 'i18n';
import { InputNumber } from 'components/InputNumber';
import BigNumber from 'bignumber.js';
import { ReactComponent as SwapSvg } from 'assets/svg/swap.svg';
import { useCallback } from 'react';
import { SwapMode, useSwapContainer } from '../context';
import { EthErc20AssetWithBalance, GliaswapAssetWithBalance, ShadowOfEthWithBalance } from '@gliaswap/commons';
import { useGlobalConfig } from 'contexts/config';
import { useState } from 'react';
import { CROSS_CHAIN_FEE } from 'suite/constants';
import { useGliaswap } from 'contexts';
import { useSwapTable } from './hooks';
import { getValidBalanceString } from 'utils';

const FormContainer = styled(Form)`
  .submit {
    margin-top: 32px;
    margin-bottom: 0;
  }
  .swap {
    text-align: center;
    margin-bottom: 16px;
    height: 22px;
    &.clickable {
      cursor: pointer;
    }
    &.unclickable {
      cursor: not-allowed;
    }
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
    setCurrentEthTx,
    setCurrentTx,
    shouldApprove,
    approveERC20,
    approveText,
    isApproving,
    payMax,
  } = useSwapContainer();
  const { bridgeAPI } = useGlobalConfig();
  const {
    currentCkbAddress: ckbAddress,
    currentEthAddress: ethAddress,
    adapter,
    realtimeAssets: assets,
  } = useGliaswap();

  const [isFetchingOrder, setIsFetchingOrder] = useState(false);

  const { web3 } = adapter.raw;

  const getBalance = useCallback(
    (field: string, asset: GliaswapAssetWithBalance) => {
      const val = form.getFieldValue(field);
      const decimal = +asset.decimals;
      return new BigNumber(val).times(10 ** decimal).toFixed(decimal, BigNumber.ROUND_DOWN);
    },
    [form],
  );

  const {
    onReceiveSelect,
    onPaySelectAsset,
    receiveSelectorDisabledKeys,
    isPairToggleable,
    changePair,
    setIsPayInvalid,
    setIsReceiveInvalid,
    disabled,
  } = useSwapTable({
    form,
    tokenA,
    tokenB,
    assets,
  });

  const swapCrossChain = useCallback(async () => {
    const balanceA = getBalance('pay', tokenA!);
    const balanceB = getBalance('receive', tokenB!);
    const newTokenA: GliaswapAssetWithBalance = { ...tokenA, balance: balanceA };
    const newTokenB: GliaswapAssetWithBalance = { ...tokenB, balance: balanceB };
    setTokenA(newTokenA);
    setTokenB(newTokenB);
    if (swapMode === SwapMode.CrossIn) {
      const { data } = await bridgeAPI.shadowAssetCrossIn(
        newTokenA as EthErc20AssetWithBalance,
        ckbAddress,
        ethAddress,
        web3!,
      );
      setCurrentEthTx(data);
    } else {
      const { data } = await bridgeAPI.shadowAssetCrossOut(newTokenA as ShadowOfEthWithBalance, ckbAddress, ethAddress);
      const tx = await bridgeAPI.rawTransactionToPWTransaction(data.raw_tx);
      setCurrentTx(tx);
    }
    setReviewModalVisable(true);
  }, [
    setReviewModalVisable,
    setTokenA,
    tokenA,
    setTokenB,
    tokenB,
    getBalance,
    swapMode,
    bridgeAPI,
    ckbAddress,
    ethAddress,
    web3,
    setCurrentEthTx,
    setCurrentTx,
  ]);

  const onSubmit = useCallback(async () => {
    setIsFetchingOrder(true);
    try {
      if (swapMode === SwapMode.CrossIn || swapMode === SwapMode.CrossOut) {
        await swapCrossChain();
      }
    } catch (error) {
      // if (process.env.NODE_ENV === 'development') {
      //   throw new Error(error);
      // }
      Modal.error({
        title: 'Build Transaction',
        content: error.message,
      });
    } finally {
      setIsFetchingOrder(false);
    }
  }, [swapCrossChain, swapMode, setIsFetchingOrder]);

  const fillFormWithPay = useCallback(
    (val: string, setSelf = false) => {
      if (setSelf) {
        form.setFieldsValue({ pay: val });
      }
      if (swapMode === SwapMode.CrossIn) {
        setPay(val);
        form.setFieldsValue({ receive: val });
      } else if (swapMode === SwapMode.CrossOut) {
        const v = getValidBalanceString(new BigNumber(val).times(1 - CROSS_CHAIN_FEE), tokenA.decimals);
        setPay(v);
        form.setFieldsValue({
          receive: v,
        });
      }
      form.validateFields(['receive']);
    },
    [setPay, swapMode, form, tokenA.decimals],
  );

  const payOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      fillFormWithPay(val);
    },
    [fillFormWithPay],
  );

  const receiveOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (swapMode === SwapMode.CrossIn) {
        setReceive(val);
        form.setFieldsValue({ pay: val });
      } else if (swapMode === SwapMode.CrossOut) {
        const v = getValidBalanceString(new BigNumber(val).div(1 - CROSS_CHAIN_FEE), tokenA.decimals);
        setReceive(v);
        form.setFieldsValue({
          pay: v,
        });
      }
      form.validateFields(['pay']);
    },
    [setReceive, swapMode, form, tokenA.decimals],
  );

  const checkPay = useCallback(
    (_: unknown, value: string) => {
      const val = new BigNumber(value);

      if (val.isLessThanOrEqualTo(0)) {
        setIsPayInvalid(true);
        return Promise.reject(i18n.t('validation.lte-zero'));
      }

      if (val.isNaN()) {
        setIsPayInvalid(true);
        return Promise.reject(i18n.t('validation.invalid-number'));
      }

      if (!val.decimalPlaces(tokenA.decimals).isEqualTo(val)) {
        setIsPayInvalid(true);
        return Promise.reject(i18n.t('validation.decimal', { decimal: tokenA.decimals }));
      }

      if (val.gt(payMax)) {
        setIsPayInvalid(true);
        return Promise.reject(i18n.t('validation.gt-max'));
      }

      setIsPayInvalid(false);

      return Promise.resolve();
    },
    [tokenA.decimals, payMax, setIsPayInvalid],
  );

  const checkReceive = useCallback(
    (_: unknown, value: string) => {
      const val = new BigNumber(value);

      if (val.isLessThanOrEqualTo(0)) {
        setIsReceiveInvalid(true);
        return Promise.reject(i18n.t('validation.lte-zero'));
      }

      if (val.isNaN()) {
        setIsReceiveInvalid(true);
        return Promise.reject(i18n.t('validation.invalid-number'));
      }

      if (!val.decimalPlaces(tokenB.decimals).isEqualTo(val)) {
        setIsReceiveInvalid(true);
        return Promise.reject(i18n.t('validation.decimal', { decimal: tokenB.decimals }));
      }

      setIsReceiveInvalid(false);

      return Promise.resolve();
    },
    [tokenB.decimals, setIsReceiveInvalid],
  );

  return (
    <Block>
      <FormContainer
        form={form}
        layout="vertical"
        onChange={() => {
          const err = form.getFieldsError(['pay', 'receive']);
          console.log(err, 'fuck');
        }}
      >
        <InputNumber
          label={i18n.t('swap.order-table.you-pay')}
          name="pay"
          max={payMax}
          assets={assets.value}
          setMax={(max) => fillFormWithPay(max, true)}
          renderKeys={(a) => a.symbol}
          inputProps={{
            onChange: payOnChange,
          }}
          formItemProps={{
            rules: [
              {
                validator: checkPay,
              },
            ],
          }}
          selectorProps={{
            selectedKey: tokenA?.symbol,
            onSelected: onPaySelectAsset,
            group: (a) => a.chainType,
            bold: true,
          }}
        />
        <div className={`swap ${isPairToggleable ? 'clickable' : 'unclickable'}`} onClick={changePair}>
          <SwapSvg />
        </div>
        <InputNumber
          label={i18n.t('swap.order-table.you-receive')}
          name="receive"
          assets={assets.value}
          inputProps={{
            onChange: receiveOnChange,
          }}
          formItemProps={{
            rules: [
              {
                validator: checkReceive,
              },
            ],
          }}
          renderKeys={(a) => a.symbol}
          selectorProps={{
            selectedKey: tokenB?.symbol,
            onSelected: onReceiveSelect,
            disabledKeys: receiveSelectorDisabledKeys,
            group: (a) => a.chainType,
            bold: true,
          }}
        />
        <Form.Item className="submit">
          {!shouldApprove ? (
            <ConfirmButton
              text={i18n.t('swap.order-table.swap')}
              htmlType="submit"
              onClick={onSubmit}
              loading={isFetchingOrder}
              disabled={disabled}
            />
          ) : (
            <ConfirmButton
              htmlType="button"
              text={approveText}
              loading={isApproving}
              disabled={isApproving}
              onClick={approveERC20}
            />
          )}
        </Form.Item>
      </FormContainer>
    </Block>
  );
};
