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
import { useGliaswap, useGliaswapAssets } from 'contexts';
import { useSwapTable } from './hooks';
import { getValidBalanceString } from 'utils';
import { calcPayWithReceive, calcReceiveWithPay, getInputFromValue, getValueFromInput } from './fee';
import { InfoTable } from './InfoTable';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { Script } from '@lay2/pw-core';

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
    tokenA,
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
    api,
    currentUserLock,
  } = useGliaswap();
  const [setting] = useGlobalSetting();
  const { shadowEthAssets } = useGliaswapAssets();

  const [isFetchingOrder, setIsFetchingOrder] = useState(false);

  const { web3 } = adapter.raw;

  const {
    onReceiveSelect,
    onPaySelectAsset,
    receiveSelectorDisabledKeys,
    isPairToggleable,
    changePair,
    setIsPayInvalid,
    setIsReceiveInvalid,
    disabled,
    payReserve,
    receiveReserve,
    price,
    priceImpact,
  } = useSwapTable({
    form,
    tokenA,
    tokenB,
    assets,
  });

  const swapCrossChain = useCallback(async () => {
    if (swapMode === SwapMode.CrossIn) {
      const { data } = await bridgeAPI.lock(tokenA as EthErc20AssetWithBalance, ckbAddress, ethAddress, web3!);
      setCurrentEthTx(data);
    } else {
      const { data } = await bridgeAPI.shadowAssetCrossOut(tokenA as ShadowOfEthWithBalance, ckbAddress, ethAddress);
      const tx = await bridgeAPI.rawTransactionToPWTransaction(data.raw_tx);
      setCurrentTx(tx);
    }
  }, [bridgeAPI, ckbAddress, ethAddress, setCurrentEthTx, setCurrentTx, swapMode, tokenA, web3]);

  const swapNormalOrder = useCallback(
    async (amountInToken: GliaswapAssetWithBalance) => {
      const balance = new BigNumber(tokenB.balance).times(1 - setting.slippage).toFixed(0, BigNumber.ROUND_DOWN);
      const { tx } = await api.swapNormalOrder(amountInToken, { ...tokenB, balance }, currentUserLock!);
      setCurrentTx(tx);
      return tx;
    },
    [tokenB, currentUserLock, api, setCurrentTx, setting.slippage],
  );

  const swapCrossChainOrder = useCallback(
    async (amountInToken: EthErc20AssetWithBalance) => {
      const shadowAsset = shadowEthAssets.find((a) => a.shadowFrom.address === amountInToken.address)!;
      const ckbTx = await swapNormalOrder({ ...shadowAsset, balance: amountInToken.balance });
      const lock = ckbTx.raw.outputs[0].lock;
      const ckbAddress = new Script(lock.codeHash, lock.args, lock.hashType).toAddress().toCKBAddress();
      const { data } = await bridgeAPI.lock(amountInToken, ckbAddress, ethAddress, web3!);
      setCurrentEthTx(data);
    },
    [bridgeAPI, ethAddress, setCurrentEthTx, shadowEthAssets, swapNormalOrder, web3],
  );

  const onSubmit = useCallback(async () => {
    setIsFetchingOrder(true);
    try {
      if (swapMode === SwapMode.CrossIn || swapMode === SwapMode.CrossOut) {
        await swapCrossChain();
      } else if (swapMode === SwapMode.CrossChainOrder) {
        await swapCrossChainOrder(tokenA as EthErc20AssetWithBalance);
      } else {
        await swapNormalOrder(tokenA);
      }
      setReviewModalVisable(true);
    } catch (error) {
      Modal.error({
        title: 'Build Transaction',
        content: error.message,
      });
    } finally {
      setIsFetchingOrder(false);
    }
  }, [
    swapCrossChain,
    swapMode,
    setIsFetchingOrder,
    setReviewModalVisable,
    swapCrossChainOrder,
    swapNormalOrder,
    tokenA,
  ]);

  const fillReceiveWithPay = useCallback(
    (val: string, setSelf = false) => {
      if (setSelf) {
        form.setFieldsValue({ pay: val });
        setPay(val);
      }

      if (swapMode === SwapMode.CrossIn) {
        form.setFieldsValue({ receive: val });
        setReceive(val);
      } else if (swapMode === SwapMode.CrossOut) {
        const receive = getValidBalanceString(new BigNumber(val).times(1 - CROSS_CHAIN_FEE), tokenA.decimals);
        form.setFieldsValue({
          receive,
        });
        setReceive(receive);
      } else {
        const pay = getValueFromInput(val, tokenA.decimals);
        const receive = pay
          ? getInputFromValue(calcReceiveWithPay(pay, payReserve, receiveReserve), tokenB.decimals)
          : '';
        form.setFieldsValue({
          receive,
        });
        setReceive(receive);
      }
      form.validateFields(['receive']);
    },
    [swapMode, form, tokenA.decimals, setPay, setReceive, payReserve, receiveReserve, tokenB.decimals],
  );

  const payOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPay(val);
      fillReceiveWithPay(val);
    },
    [fillReceiveWithPay, setPay],
  );

  const receiveOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setReceive(val);
      if (swapMode === SwapMode.CrossIn) {
        form.setFieldsValue({ pay: val });
        setPay(val);
      } else if (swapMode === SwapMode.CrossOut) {
        const pay = getValidBalanceString(new BigNumber(val).div(1 - CROSS_CHAIN_FEE), tokenA.decimals);
        form.setFieldsValue({
          pay,
        });
        setPay(pay);
      } else {
        const receive = getValueFromInput(val, tokenB.decimals);
        const pay = receive
          ? getInputFromValue(calcPayWithReceive(receive, payReserve, receiveReserve), tokenA.decimals)
          : '';
        form.setFieldsValue({
          pay,
        });
        setPay(pay);
      }
      form.validateFields(['pay']);
    },
    [setReceive, swapMode, form, tokenA.decimals, setPay, tokenB.decimals, payReserve, receiveReserve],
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
      <FormContainer form={form} layout="vertical">
        <InputNumber
          label={i18n.t('swap.order-table.you-pay')}
          name="pay"
          max={payMax}
          assets={assets.value}
          setMax={(max) => fillReceiveWithPay(max, true)}
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
        {disabled ? null : (
          <InfoTable tokenA={tokenA} tokenB={tokenB} price={price} priceImpact={priceImpact} swapMode={swapMode} />
        )}
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
