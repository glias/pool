import React from 'react';
import { Block } from 'components/Block';
import { ConfirmButton } from 'components/ConfirmButton';
import { Form } from 'antd';
import styled from 'styled-components';
import i18n from 'i18n';
import { InputNumber } from 'components/InputNumber';
import BigNumber from 'bignumber.js';
import { ReactComponent as SwapSvg } from 'asserts/svg/swap.svg';

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
  return (
    <Block>
      <FormContainer form={form} layout="vertical">
        <InputNumber
          label={i18n.t('swap.order-list.you-pay')}
          name="pay"
          max="0.1"
          asserts={[]}
          renderKeys={(_, i) => i}
          formItemProps={{
            rules: [
              {
                validator: (_, val: string) => {
                  if (new BigNumber(val).isLessThan(1)) {
                    return Promise.reject('some error');
                  }
                },
              },
            ],
          }}
        />
        <div className="swap">
          <SwapSvg />
        </div>
        <InputNumber
          label={i18n.t('swap.order-list.you-receive')}
          name="receive"
          max="0.1"
          asserts={[]}
          renderKeys={(_, i) => i}
        />
        <Form.Item className="submit">
          <ConfirmButton text={i18n.t('swap.order-list.swap')} />
        </Form.Item>
      </FormContainer>
    </Block>
  );
};
