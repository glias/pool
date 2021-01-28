import React from 'react';
import styled from 'styled-components';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
  .label {
    font-weight: bold;
    font-size: 12px;
    line-height: 14px;
    color: #7e7e7e;
    align-items: flex-start;
    flex: 1;
    svg {
      cursor: pointer;
      margin-left: 4px;
    }
  }
  .value {
    font-weight: normal;
    font-size: 12px;
    line-height: 14px;
    color: #000000;
    align-items: flex-end;
    display: flex;
    flex-direction: row;
    .equal {
      margin-left: 4px;
      margin-right: 4px;
    }
  }
  &:last-child {
    margin-bottom: 0;
  }
`;

export interface TableRowProps {
  label: React.ReactNode;
  labelTooltip?: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}

export const TableRow = ({ label, labelTooltip, value, children }: TableRowProps) => {
  return (
    <Row>
      <span className="label">
        {label}
        {labelTooltip ? (
          <Tooltip title={labelTooltip}>
            <QuestionCircleOutlined />
          </Tooltip>
        ) : null}
      </span>
      <span className="value">{value ?? children}</span>
    </Row>
  );
};
