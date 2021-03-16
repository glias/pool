import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import i18n from 'i18n';
import React from 'react';

export const RequestFeeLabel = () => {
  return (
    <span>
      {i18n.t('Request fee')}&nbsp;
      <Tooltip overlay={i18n.t('This fee goes to deal-miners as the incentives')}>
        <InfoCircleOutlined />
      </Tooltip>
    </span>
  );
};
