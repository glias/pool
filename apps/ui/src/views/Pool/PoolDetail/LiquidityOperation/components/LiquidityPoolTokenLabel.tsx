import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import i18n from 'i18n';
import React from 'react';

export const LiquidityPoolTokenTooltip: React.FC = ({ children }) => {
  return (
    <Tooltip
      overlay={i18n.t(
        'Pool tokens represent your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time',
      )}
    >
      {children} <QuestionCircleOutlined style={{ fontSize: '0.8em' }} />
    </Tooltip>
  );
};
