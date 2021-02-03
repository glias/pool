import { WarningOutlined } from '@ant-design/icons';
import { Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import i18n from 'i18n';
import React, { useMemo } from 'react';
import { QueryObserverResult } from 'react-query';
import styled from 'styled-components';

interface UpdateStatusProps {
  query: QueryObserverResult;

  timeFormat?: string;
}

const UpdateStatusWrapper = styled.span`
  padding-left: 4px;
  font-size: 0.8em;
  color: rgba(0, 0, 0, 0.25);
`;

export const QueryTips: React.FC<UpdateStatusProps> = (props) => {
  const { timeFormat = 'HH:mm:ss' } = props;
  const { dataUpdatedAt, status } = props.query;

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return <Tooltip overlay={i18n.t(`last update at`)}>{dayjs(dataUpdatedAt).format(timeFormat)}</Tooltip>;
  }, [dataUpdatedAt, timeFormat]);

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
