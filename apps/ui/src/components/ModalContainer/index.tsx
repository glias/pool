import { Modal } from 'antd';
import { ModalProps } from 'antd/lib/modal';
import styled from 'styled-components';

const Container = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px !important;
  }

  .ant-modal-header {
    border-radius: 16px !important;
    border-bottom: none;
    padding: 16px;
  }

  .ant-modal-title {
    font-weight: bold !important;
    text-align: center;
  }

  .ant-modal-body {
    padding: 16px;
    padding-top: 0;
  }
`;

export const ModalContainer: React.FC<ModalProps> = (props) => {
  const { children, ...rest } = props;
  return <Container {...rest}>{children}</Container>;
};
