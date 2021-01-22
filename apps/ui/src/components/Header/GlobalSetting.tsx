import { SettingOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd';
import React from 'react';

export const GlobalSetting: React.FC = () => {
  return (
    <Popover content="Setting" trigger="click">
      <Button icon={<SettingOutlined />} />
    </Popover>
  );
};
