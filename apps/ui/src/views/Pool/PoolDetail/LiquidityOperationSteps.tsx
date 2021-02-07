import { LiquidityOperationSummary } from '@gliaswap/commons';
import { Steps } from 'antd';
import { exploreTransaction } from 'envs';
import i18n from 'i18n';
import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

interface LiquidityOperationStepsProps {
  summary: LiquidityOperationSummary;
}

const Step = Steps.Step;

function renderStepItem(title: string, txHash?: string) {
  if (txHash)
    return (
      <Step
        title={
          <a target="_blank" rel="noopener noreferrer" href={exploreTransaction(txHash)}>
            {i18n.t(title)}
          </a>
        }
      />
    );
  return <Step title={i18n.t(title)} />;
}

export const LiquidityOperationSteps: React.FC<LiquidityOperationStepsProps> = ({ summary }) => {
  const { type, stage } = summary;

  if (type === 'add' && stage.status === 'pending') {
    return (
      <Steps direction="vertical" size="small" current={1}>
        {renderStepItem('Submitted', stage.steps[0].txHash)}
        {renderStepItem('Confirming on Nervos')}
        {renderStepItem('Add liquidity successfully!')}
      </Steps>
    );
  }

  if (type === 'add' && stage.status === 'open') {
    return (
      <Steps direction="vertical" size="small" current={2}>
        {renderStepItem('Submitted', stage.steps[0].txHash)}
        {renderStepItem('Confirmed on Nervos', stage.steps[1].txHash)}
        {renderStepItem('Adding liquidity')}
      </Steps>
    );
  }

  if (type === 'add' && stage.status === 'canceling') {
    return (
      <Steps direction="vertical" size="small" current={2}>
        {renderStepItem('Submitted', stage.steps[0].txHash)}
        {renderStepItem('Confirmed on Nervos', stage.steps[1].txHash)}
        {renderStepItem('Cancelling Add liquidity', stage.steps[2].txHash)}
      </Steps>
    );
  }

  if (type === 'remove' && stage.status === 'pending') {
    return (
      <Steps direction="vertical" size="small" current={1}>
        {renderStepItem('Submitted', stage.steps[0].txHash)}
        {renderStepItem('Confirming on Nervos')}
        {renderStepItem('Remove liquidity successfully!')}
      </Steps>
    );
  }

  if (type === 'remove' && stage.status === 'open') {
    return (
      <Steps direction="vertical" size="small" current={2}>
        {renderStepItem('Submitted', stage.steps[0].txHash)}
        {renderStepItem('Confirming on Nervos', stage.steps[1].txHash)}
        {renderStepItem('Removing Liquidity')}
      </Steps>
    );
  }

  if (type === 'remove' && stage.status === 'canceling') {
    return (
      <Steps direction="vertical" size="small" current={2}>
        {renderStepItem('Submitted', stage.steps[0].txHash)}
        {renderStepItem('Confirming on Nervos', stage.steps[1].txHash)}
        {renderStepItem('Cancelling Remove Liquidity', stage.steps[2].txHash)}
      </Steps>
    );
  }

  return null;
};

const LiquidityOperationDetailWrapper = styled.div`
  .tips {
    font-size: 12px;
    line-height: 14px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 2px;
    color: #000;
  }
`;

export const LiquidityOperationDetail: React.FC<LiquidityOperationStepsProps> = ({ summary }) => {
  const tips =
    summary.type === 'add'
      ? 'Normally your add liquidity will complete successfully soon after <strong>step 2</strong>, but if the price fluctuates above the slippage, your add liquidity request will be pending until the pool price fluctuates back to the price you submitted. You also have the option to cancel the operation if it takes too long.'
      : 'Normally your remove liquidity will complete successfully soon after <strong>step 2</strong>, but if the price fluctuates above the slippage, your remove liquidity request will be pending until the pool price fluctuates back to the price you submitted. You also have the option to cancel the request if it takes too long.';
  return (
    <LiquidityOperationDetailWrapper>
      <div className="step">
        <LiquidityOperationSteps summary={summary} />
      </div>
      <div className="tips">
        <Trans defaults={tips} components={{ strong: <strong /> }} />
      </div>
    </LiquidityOperationDetailWrapper>
  );
};
