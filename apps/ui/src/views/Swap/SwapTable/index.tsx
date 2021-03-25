import {
  CkbModel,
  EthModel,
  EthErc20AssetWithBalance,
  GliaswapAssetWithBalance,
  isCkbAsset,
  isCkbNativeAsset,
  ShadowFromEthWithBalance,
  CkbAsset,
  EthAsset,
} from '@gliaswap/commons';
import { HashType, Script } from '@lay2/pw-core';
import { Form, Modal } from 'antd';
import { ReactComponent as SwapSvg } from 'assets/svg/swap.svg';
import BigNumber from 'bignumber.js';
import { Block } from 'components/Block';
import { ConfirmButton } from 'components/ConfirmButton';
import { InputNumber } from 'components/InputNumber';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import i18n from 'i18n';
import { isEmpty } from 'lodash';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Amount, getAvailableBalance } from 'suite';
import { CROSS_CHAIN_FEE } from 'suite/constants';
import { getValidBalanceString } from 'utils';
import { SwapMode, useSwapContainer } from '../context';
import { InfoTable } from './InfoTable';
import { calcPayWithReceive, calcReceiveWithPay, getInputFromValue, getValueFromInput } from './fee';
import { useSwapTable } from './hooks';

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

  > .warning {
    font-size: 12px;
    line-height: 14px;
    color: #ff4d4f;
    margin-bottom: 16px;
  }
`;

const renderTokenSelectorKey = (asset: GliaswapAssetWithBalance) => {
  if (isCkbAsset(asset)) {
    return asset.typeHash;
  }
  return asset.address;
};

export const SwapTable: React.FC = () => {
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
    ckbEnoughMessage,
    form,
    previousPair,
  } = useSwapContainer();
  const {
    currentCkbAddress: ckbAddress,
    currentEthAddress: ethAddress,
    adapter,
    realtimeAssets: assets,
    api,
    currentUserLock,
    bridgeAPI,
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
    poolName,
    currentPoolAssets,
    poolInfo,
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
      try {
        const { data } = await bridgeAPI.shadowAssetCrossOut(
          tokenA as ShadowFromEthWithBalance,
          ckbAddress,
          ethAddress,
        );
        const tx = await bridgeAPI.rawTransactionToPWTransaction(data.raw_tx);
        setCurrentTx(tx);
      } catch (error) {
        throw new Error('The bridge server is fail to respond.');
      }
    }
  }, [bridgeAPI, ckbAddress, ethAddress, setCurrentEthTx, setCurrentTx, swapMode, tokenA, web3]);

  const swapNormalOrder = useCallback(
    async (amountInToken: GliaswapAssetWithBalance) => {
      const balance = new BigNumber(tokenB.balance).times(1 - setting.slippage).toFixed(0, BigNumber.ROUND_DOWN);
      const { tx } = await api.swapNormalOrder(amountInToken, { ...tokenB, balance }, currentUserLock!);
      setCurrentTx(tx);
      return tx as any;
    },
    [tokenB, currentUserLock, api, setCurrentTx, setting.slippage],
  );

  const getSwapOrderLock = useCallback(
    async (amountInToken: GliaswapAssetWithBalance) => {
      const balance = new BigNumber(tokenB.balance).times(1 - setting.slippage).toFixed(0, BigNumber.ROUND_DOWN);
      const lock = await api.getSwapOrderLock(amountInToken, { ...tokenB, balance }, currentUserLock!);
      return lock;
    },
    [tokenB, currentUserLock, api, setting.slippage],
  );

  const swapCrossChainOrder = useCallback(
    async (amountInToken: EthErc20AssetWithBalance) => {
      const shadowAsset = shadowEthAssets.find((a) => a.shadowFrom.address === amountInToken.address)!;
      const { lock } = await getSwapOrderLock({ ...shadowAsset, balance: amountInToken.balance });
      const ckbAddress = new Script(lock.codeHash, lock.args, lock.hashType === 'data' ? HashType.data : HashType.type)
        .toAddress()
        .toCKBAddress();
      try {
        const { data } = await bridgeAPI.lock(amountInToken, ckbAddress, ethAddress, web3!);
        setCurrentEthTx(data);
      } catch (error) {
        throw new Error('The bridge server is fail to respond.');
      }
    },
    [bridgeAPI, ethAddress, setCurrentEthTx, shadowEthAssets, web3, getSwapOrderLock],
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
        form.validateFields(['pay']);
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

  const fillPayWithReceive = useCallback(
    (val: string, setSelf = false) => {
      setReceive(val);
      if (setSelf) {
        form.setFieldsValue({ receive: val });
        form.validateFields(['receive']);
      }
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

  const receiveOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      fillPayWithReceive(val);
    },
    [fillPayWithReceive],
  );

  // fill pay or receive when pair changes
  useEffect(() => {
    const prevTokenA = previousPair?.tokenA;
    const prevTokenB = previousPair?.tokenB;
    const receiveFromInput = form.getFieldValue('receive');
    const payFromInput = form.getFieldValue('pay');

    if (isEmpty(prevTokenA) || isEmpty(prevTokenB) || isEmpty(receiveFromInput) || isEmpty(payFromInput)) {
      return;
    }

    const receive = new Amount(
      new BigNumber(receiveFromInput).times(10 ** tokenB.decimals),
      tokenB.decimals,
    ).toHumanizeWithMaxDecimal();
    const pay = new Amount(
      new BigNumber(payFromInput).times(10 ** tokenA.decimals),
      tokenA.decimals,
    ).toHumanizeWithMaxDecimal();

    if (CkbModel.isCurrentChainAsset(tokenA) && !CkbModel.equals(tokenA, prevTokenA as CkbAsset)) {
      fillPayWithReceive(receive, true);
      return;
    }
    if (EthModel.isCurrentChainAsset(tokenA) && !EthModel.equals(tokenA, prevTokenA as EthAsset)) {
      fillPayWithReceive(receive, true);
      return;
    }
    if (CkbModel.isCurrentChainAsset(tokenB) && !CkbModel.equals(tokenB, prevTokenB as CkbAsset)) {
      fillReceiveWithPay(pay, true);
      return;
    }
    if (EthModel.isCurrentChainAsset(tokenB) && !EthModel.equals(tokenB, prevTokenB as EthAsset)) {
      fillReceiveWithPay(pay, true);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA.symbol, tokenB.symbol]);

  const isCkbBuySudt = useMemo(() => isCkbNativeAsset(tokenA), [tokenA]);

  const checkPay = useCallback(
    (_: unknown, value: string) => {
      const val = new BigNumber(value);
      const valWithDecimal = val.times(10 ** tokenA.decimals);

      if (swapMode === SwapMode.CrossChainOrder || swapMode === SwapMode.NormalOrder) {
        if (valWithDecimal.isGreaterThan(payReserve)) {
          setIsPayInvalid(true);
          return Promise.reject(i18n.t('validation.liquid'));
        }
      }

      if (val.isLessThanOrEqualTo(0)) {
        setIsPayInvalid(true);
        return Promise.reject(i18n.t('validation.lte-zero'));
      }

      if (swapMode === SwapMode.NormalOrder && isCkbBuySudt) {
        if (val.isLessThanOrEqualTo(4)) {
          setIsPayInvalid(true);
          return Promise.reject(i18n.t('validation.minimum-pay'));
        }
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
    [tokenA.decimals, payMax, setIsPayInvalid, payReserve, swapMode, isCkbBuySudt],
  );

  const checkReceive = useCallback(
    (_: unknown, value: string) => {
      const val = new BigNumber(value);
      const valWithDecimal = val.times(10 ** tokenB.decimals);

      if (swapMode === SwapMode.CrossChainOrder || swapMode === SwapMode.NormalOrder) {
        if (valWithDecimal.isGreaterThan(receiveReserve)) {
          setIsReceiveInvalid(true);
          return Promise.reject(i18n.t('validation.liquid'));
        }
      }

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
    [tokenB.decimals, setIsReceiveInvalid, receiveReserve, swapMode],
  );

  return (
    <Block>
      <FormContainer form={form} layout="vertical">
        {ckbEnoughMessage ? (
          <Form.Item className="warning">
            <span>{ckbEnoughMessage}</span>{' '}
          </Form.Item>
        ) : null}
        {currentPoolAssets.length === 0 &&
        poolInfo.value.length !== 0 &&
        (swapMode === SwapMode.CrossChainOrder || swapMode === SwapMode.NormalOrder) ? (
          <Form.Item className="warning">
            <span>{i18n.t('validation.pool-not-exist', { poolName })}</span>{' '}
          </Form.Item>
        ) : null}
        <InputNumber
          label={i18n.t('swap.order-table.you-pay')}
          name="pay"
          max={payMax}
          assets={assets.value}
          setMax={(max) => fillReceiveWithPay(max, true)}
          renderKeys={renderTokenSelectorKey}
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
            selectedKey: isCkbAsset(tokenA) ? tokenA.typeHash : tokenA.address,
            onSelected: onPaySelectAsset,
            group: (a) => a.chainType,
            bold: true,
            enableSearch: true,
            balanceCaculator: getAvailableBalance,
            destroyModalOnClose: true,
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
          renderKeys={renderTokenSelectorKey}
          selectorProps={{
            selectedKey: isCkbAsset(tokenB) ? tokenB.typeHash : tokenB.address,
            onSelected: onReceiveSelect,
            disabledKeys: receiveSelectorDisabledKeys,
            group: (a) => a.chainType,
            bold: true,
            enableSearch: true,
            balanceCaculator: getAvailableBalance,
            destroyModalOnClose: true,
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
