import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import i18n from 'i18n';
import React from 'react';

export const TransactionFeeLabel = () => {
  return (
    <span>
      {i18n.t('Transaction fee')}&nbsp;
      <Tooltip overlay={i18n.t('the transaction fee')}>
        <InfoCircleOutlined />
      </Tooltip>
    </span>
  );
};
