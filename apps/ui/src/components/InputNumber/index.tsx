import { Asset } from '@gliaswap/commons';
import { Form, Input } from 'antd';
import { FormItemProps } from 'antd/lib/form';
import { InputProps } from 'antd/lib/input';
import BigNumber from 'bignumber.js';
import { AssetSelector } from 'components/AssetSelector';
import { AssetListProps } from 'components/AssetSelector/AssetList';
import { TokenSelectorProps } from 'components/AssetSelector/AssetSelector';
import i18n from 'i18n';
import React from 'react';
import styled from 'styled-components';

const ItemContainer = styled(Form.Item)`
  margin-bottom: 16px;
  .ant-form-item-label {
    label {
      font-weight: bold;
      font-size: 12px;
      line-height: 14px;
      color: rgba(0, 0, 0, 0.85);
      opacity: 0.77;
    }
  }
  &.ant-form-item-has-error {
    margin-bottom: 38px;
  }
  .ant-form-item-control-input-content {
    input[type='number']::-webkit-inner-spin-button {
      appearance: none;
    }
    input[type='number']::-webkit-outer-spin-button {
      margin: 0;
    }
  }
  .ant-form-item-control {
    .ant-form-item-explain-error {
      position: absolute;
      top: 56px;
      font-size: 12px;
      line-height: 22px;
    }
  }
  .ant-form-item-control-input-content {
    .ant-input-affix-wrapper {
      border: none;
      outline: none;
      outline-color: transparent;
      padding: 0;
      cursor: default;
      &:focus {
        box-shadow: none;
      }
      input {
        padding-left: 2px;
        font-size: 18px;
        line-height: 22px;
      }
    }
    .ant-input-affix-wrapper-focused {
      border: none;
      outline: none;
      outline-color: transparent;
      box-shadow: none;
      &:focus {
        box-shadow: none;
      }
    }
  }
  .ant-form-item-control-input {
    border: none;
    outline: none;
    outline-color: transparent;
    font-size: 18px;
    line-height: 22px;
    padding: 1px;
    &:focus {
      border: none;
      outline: none;
      outline-color: transparent;
      box-shadow: none;
    }
  }
  background: #ffffff;
  border: 1px solid #e1e1e1;
  border-radius: 16px;
  padding: 16px;
  .right {
    .max {
      font-size: 12px;
      line-height: 14px;
      text-align: right;
      color: #7e7e7e;
    }
  }
`;

const MaxContainer = styled.div`
  position: absolute;
  top: -30px;
  right: 0;
  button {
    font-size: 12px;
    line-height: 14px;
    color: #7e7e7e;
    border: none;
    background-color: white;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    &:focus {
      outline: none;
      box-shadow: none;
    }
  }
`;

export type Key = string | number;
export interface InputItemProps<T extends Asset, K extends Key> {
  max?: string;
  setMax?: (max: string) => void;
  label: string;
  name: string;
  assets: T[];
  renderKeys: AssetListProps<T, K>['renderKey'];
  formItemProps?: Omit<FormItemProps, 'name'>;
  inputProps?: Omit<InputProps, 'bordered' | 'type' | 'placeholder' | 'suffix'>;
  selectorProps?: Omit<TokenSelectorProps<T, K>, 'assets' | 'renderKey'>;
}

export function InputNumber<T extends Asset, K extends Key>({
  max,
  setMax,
  label,
  name,
  formItemProps,
  inputProps,
  assets,
  renderKeys,
  selectorProps,
}: InputItemProps<T, K>) {
  return (
    <ItemContainer label={label}>
      {max ? (
        <MaxContainer>
          <button type="button" onClick={() => setMax?.(max)}>
            {`${i18n.t('common.max')}: ${new BigNumber(max).toFixed(4, BigNumber.ROUND_DOWN)}`}
          </button>
        </MaxContainer>
      ) : null}
      <Form.Item name={name} noStyle {...formItemProps}>
        <Input
          bordered={false}
          type="number"
          placeholder="0.0"
          suffix={<AssetSelector assets={assets} renderKey={renderKeys} {...selectorProps} />}
          {...inputProps}
        />
      </Form.Item>
    </ItemContainer>
  );
}
