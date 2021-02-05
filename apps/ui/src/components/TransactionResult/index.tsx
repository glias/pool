import React from 'react';
import { Result } from 'antd';
import styled from 'styled-components';
import { ConfirmButton } from 'components/ConfirmButton';
import i18n from 'i18n';
import { ReactComponent as SuccessSvg } from 'assets/svg/success.svg';
import { ReactComponent as DeclineSvg } from 'assets/svg/decline.svg';
import { etherscanTransaction, exploreTransaction } from 'envs';

export interface ResultProps {
  txHash: string;
  isEth?: boolean;
  onDismiss?: () => void;
}

export const ResultContainer = styled.div`
  a {
    text-decoration: underline;
    color: #5c61da;
  }
  .ant-result-title {
    font-size: 14px;
    line-height: 17px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .ant-result-subtitle {
    font-weight: normal;
    font-size: 12px;
    line-height: 14px;
  }
`;

export const SuccessResult = ({ txHash, isEth, onDismiss }: ResultProps) => {
  const url = isEth ? etherscanTransaction(txHash) : exploreTransaction(txHash);
  return (
    <ResultContainer>
      <Result
        icon={<SuccessSvg />}
        status="success"
        title={i18n.t('result.success')}
        subTitle={
          <a target="_blank" rel="noopener noreferrer" href={url}>
            {i18n.t(isEth ? 'result.etherscan' : 'result.explorer')}
          </a>
        }
      />
      <ConfirmButton text={i18n.t('result.dismiss')} onClick={onDismiss} />
    </ResultContainer>
  );
};

export const DeclineResult = ({ errMessage, onDismiss }: { errMessage: React.ReactNode; onDismiss?: () => void }) => {
  return (
    <ResultContainer>
      <Result title={i18n.t('result.decline')} icon={<DeclineSvg />} status="error" subTitle={errMessage} />
      <ConfirmButton text={i18n.t('result.dismiss')} onClick={onDismiss} />
    </ResultContainer>
  );
};

export enum TransactionStatus {
  Normal = 'Normal',
  Success = 'Success',
  Decline = 'Decline',
}
