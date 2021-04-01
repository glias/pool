import { SettingOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Popover, Row } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import { FormItemProps } from 'antd/lib/form';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import i18n from 'i18n';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import './GlobalSetting.css';

const GlobalSettingWrapper = styled.div`
  width: 375px;

  .setting-title {
    padding: 8px 0;
  }

  header {
    font-weight: bold;
    font-size: 18px;
  }
`;

const SettingContent: React.FC = () => {
  const [setting, setSetting] = useGlobalSetting();
  const [inputSlippage, setInputSlippage] = useState(String(setting.slippage * 100));

  function setSlippage(input: string) {
    if (!/^\d{0,2}(\.\d{0,4})?$/.test(input)) return;
    setInputSlippage(input);

    const slippage = Number(input) / 100;
    if (isNaN(slippage) || slippage < 0) return;
    if (slippage >= 1) return setSetting({ slippage: 0.999999 });

    setSetting({ slippage });
  }

  const slippage = setting.slippage;

  function buttonProps(target: number): ButtonProps {
    return {
      block: true,
      type: slippage === target ? 'primary' : 'default',
      onClick() {
        setSlippage(String(target * 100));
      },
    };
  }

  const validateProps = useMemo<FormItemProps>(() => {
    const slippage = Number(inputSlippage) / 100;
    if (slippage <= 0.003) return { validateStatus: 'warning', help: i18n.t('Your swap may pending for a long time') };
    if (slippage >= 1) return { validateStatus: 'error', help: i18n.t('Slippage must be less than 1') };
    if (slippage >= 0.05) return { validateStatus: 'warning', help: i18n.t('Your swap may be front run') };

    return {};
  }, [inputSlippage]);

  return (
    <GlobalSettingWrapper>
      <header>{i18n.t('Transaction Setting')}</header>
      <Form.Item label={i18n.t('Slippage tolerance')} {...validateProps}>
        <Row gutter={4}>
          <Col span={5}>
            <Button {...buttonProps(0.001)}>0.1%</Button>
          </Col>
          <Col span={5}>
            <Button {...buttonProps(0.005)}>0.5%</Button>
          </Col>
          <Col span={5}>
            <Button {...buttonProps(0.01)}>1%</Button>
          </Col>
          <Col span={6} push={1}>
            <Input placeholder="0.5" value={inputSlippage} onChange={(e) => setSlippage(e.target.value)} suffix="%" />
          </Col>
        </Row>
      </Form.Item>
    </GlobalSettingWrapper>
  );
};

export const GlobalSetting: React.FC = () => {
  return (
    <Popover overlayClassName="setting-overlay" content={<SettingContent />} trigger="click">
      <Button style={{ borderRadius: '10px' }} icon={<SettingOutlined />} />
    </Popover>
  );
};
