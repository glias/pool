import { WarningOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { QueryStatus } from 'react-query';
import styled from 'styled-components';

interface UpdateStatusProps {
  dataUpdatedAt?: number;
  status: QueryStatus;

  timeFormat?: string;
}

const UpdateStatusWrapper = styled.span`
  padding-left: 4px;
  font-size: 0.8em;
  color: rgba(0, 0, 0, 0.25);
`;

export const QueryTips: React.FC<UpdateStatusProps> = (props) => {
  const { dataUpdatedAt, status, timeFormat = 'HH:mm:ss' } = props;
  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return dayjs(dataUpdatedAt).format(timeFormat);
  }, [dataUpdatedAt, timeFormat]);

  const statusNode = useMemo(() => {
    if (status === 'loading' || status === 'idle') return <Spin size="small" />;
    if (status === 'error') return <WarningOutlined />;
  }, [status]);

  return (
    <UpdateStatusWrapper>
      {lastUpdated}
      {statusNode}
    </UpdateStatusWrapper>
  );
};
