import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Spin, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { QueryObserverResult } from 'react-query';
import styled from 'styled-components';

interface UpdateStatusProps {
  query: QueryObserverResult;
}

const UpdateStatusWrapper = styled.span`
  padding-left: 4px;
  font-size: 0.8em;
  color: rgba(0, 0, 0, 0.25);
`;

export const QueryTips: React.FC<UpdateStatusProps> = (props) => {
  const { dataUpdatedAt, status } = props.query;

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return (
      <Tooltip overlay={() => `updated ${((Date.now() - dataUpdatedAt) / 1000).toFixed(0)}s ago`}>
        <CheckCircleOutlined style={{ color: 'rgba(0,200,0,0.75)' }} />
      </Tooltip>
    );
  }, [dataUpdatedAt]);

  const statusNode = useMemo(() => {
    if (status === 'loading' || status === 'idle') return <Spin size="small" />;
    if (status === 'error') {
      return (
        <Tooltip overlay={String(props.query.error)}>
          <WarningOutlined />
        </Tooltip>
      );
    }
  }, [props.query.error, status]);

  return (
    <UpdateStatusWrapper>
      {lastUpdated}
      {statusNode}
    </UpdateStatusWrapper>
  );
};
