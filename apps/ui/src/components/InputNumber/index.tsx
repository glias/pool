import React from 'react';
import { Form, Input } from 'antd';
import styled from 'styled-components';
import i18n from 'i18n';
import { FormItemProps } from 'antd/lib/form';
import { InputProps } from 'antd/lib/input';
import { AssetSelector } from 'components/AssetSelector';
import { Asset } from 'commons/MultiAsset';
import { AssetListProps } from 'components/AssetSelector/AssetList';
import { TokenSelectorProps } from 'components/AssetSelector/AssetSelector';

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
      top: 50px;
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

export interface InputItemProps {
  max?: string;
  setMaxPay?: (max: string) => void;
  label: string;
  name: string;
  asserts: Asset[];
  renderKeys: AssetListProps['renderKey'];
  formItemProps?: Omit<FormItemProps, 'name'>;
  inputProps?: Omit<InputProps, 'bordered' | 'type' | 'placeholder' | 'suffix'>;
  selectorProps?: Omit<TokenSelectorProps, 'assets' | 'renderKey'>;
}

export const InputNumber = ({
  max,
  setMaxPay,
  label,
  name,
  formItemProps,
  inputProps,
  asserts,
  renderKeys,
  selectorProps,
}: InputItemProps) => {
  return (
    <ItemContainer label={label}>
      {max ? (
        <MaxContainer>
          <button type="button" onClick={() => setMaxPay?.(max)}>
            {`${i18n.t('common.max')}: ${max}`}
          </button>
        </MaxContainer>
      ) : null}
      <Form.Item name={name} noStyle {...formItemProps}>
        <Input
          bordered={false}
          type="number"
          placeholder="0.0"
          suffix={<AssetSelector assets={asserts} renderKey={renderKeys} {...selectorProps} />}
          {...inputProps}
        />
      </Form.Item>
    </ItemContainer>
  );
};
