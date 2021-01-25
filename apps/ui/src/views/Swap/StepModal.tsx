import i18n from 'i18n';
import React from 'react';
import { Steps } from 'antd';
import { useSwapContainer } from './context';
import styled from 'styled-components';
import { ModalContainer } from 'components/ModalContainer';
import { useMemo } from 'react';
import { isEthAsset, SwapOrderType } from '@gliaswap/commons';
import { ETHER_SCAN_URL, EXPLORER_URL } from 'suite/constants';
import { MetaContainer } from 'components/MetaContainer';
import { Trans } from 'react-i18next';

const { Step } = Steps;

const Container = styled(ModalContainer)`
  .step {
    margin-top: 8px;
    margin-left: 32px;
    margin-bottom: 12px;
    .first {
      .ant-steps-item-title {
        position: relative;
        top: 4px;
      }
    }
    .ant-steps-item-container {
      .ant-steps-item-content {
        .ant-steps-item-title {
          font-size: 12px;
          line-height: 14px;
          a {
            text-decoration: underline;
          }
        }
        .ant-steps-item-description {
          font-size: 12px;
          line-height: 14px;
        }
      }
    }
  }
`;

function buildURL(txhash: string, isETH: boolean) {
  return isETH ? `${ETHER_SCAN_URL}tx/${txhash}` : `${EXPLORER_URL}transaction/${txhash}`;
}

interface Progress {
  title: string;
  description?: string;
  txHash?: string;
  isEth: boolean;
}

export const StepModal = () => {
  const { stepModalVisable, setStepModalVisable, currentOrder } = useSwapContainer();
  const type = currentOrder?.type!;
  const tokenA = currentOrder?.amountIn! ?? Object.create(null);
  const tokenB = currentOrder?.amountOut! ?? Object.create(null);
  const orderSteps = useMemo(() => {
    return currentOrder?.stage.steps ?? [];
  }, [currentOrder?.stage.steps]);

  const isCrossIn = useMemo(() => {
    return type === SwapOrderType.CrossChain && isEthAsset(tokenA);
  }, [type, tokenA]);

  const isCrossOut = useMemo(() => {
    return type === SwapOrderType.CrossChain && !isEthAsset(tokenA);
  }, [type, tokenA]);

  const progress: Progress[] = useMemo(() => {
    if (type === SwapOrderType.CrossChainOrder) {
      return [
        {
          title: i18n.t('swap.progress.submit'),
          description: '',
          txHash: orderSteps?.[0]?.transactionHash,
          isEth: true,
        },
        {
          title: i18n.t('swap.progress.confirm-eth'),
          description: `${i18n.t('swap.progress.lock')} ${tokenA.symbol.slice(2)}`,
          txHash: orderSteps?.[1]?.transactionHash,
          isEth: true,
        },
        {
          title: i18n.t('swap.progress.confirm-ckb'),
          description: `${tokenA.symbol.slice(2)} ➜ ${tokenA.symbol}`,
          txHash: orderSteps?.[2]?.transactionHash,
          isEth: false,
        },
        {
          title: i18n.t('swap.progress.sucess'),
          description: `${tokenA.symbol} ➜ CKB`,
          txHash: orderSteps?.[3]?.transactionHash,
          isEth: false,
        },
      ];
    } else if (isCrossIn) {
      return [
        {
          title: i18n.t('swap.progress.submit'),
          description: '',
          txHash: orderSteps?.[0]?.transactionHash,
          isEth: true,
        },
        {
          title: i18n.t('swap.progress.confirm-eth'),
          description: `${i18n.t('swap.progress.lock')} ${tokenA.symbol}`,
          txHash: orderSteps?.[1]?.transactionHash,
          isEth: true,
        },
        {
          title: i18n.t('swap.progress.sucess'),
          description: `${tokenA.symbol} ➜ ck${tokenA.symbol}`,
          txHash: orderSteps?.[2]?.transactionHash,
          isEth: false,
        },
      ];
    } else if (isCrossOut) {
      return [
        {
          title: i18n.t('swap.progress.submit'),
          description: '',
          txHash: orderSteps?.[0]?.transactionHash,
          isEth: false,
        },
        {
          title: i18n.t('swap.progress.confirm-eth'),
          description: `${i18n.t('swap.progress.burn')} ${tokenA.symbol}`,
          txHash: orderSteps?.[1]?.transactionHash,
          isEth: false,
        },
        {
          title: i18n.t('swap.progress.sucess'),
          description: `${tokenA.symbol} ➜ ${tokenA.symbol.slice(2)}`,
          txHash: orderSteps?.[2]?.transactionHash,
          isEth: true,
        },
      ];
    }

    return [
      {
        title: i18n.t('swap.progress.submit'),
        description: '',
        txHash: orderSteps?.[0]?.transactionHash,
        isEth: false,
      },
      {
        title: i18n.t('swap.progress.confirm-ckb'),
        description: `${i18n.t('swap.progress.lock')} ${tokenA.symbol}`,
        txHash: orderSteps?.[1]?.transactionHash,
        isEth: false,
      },
      {
        title: i18n.t('swap.progress.sucess'),
        description: `${tokenA.symbol} ➜ ${tokenB.symbol}`,
        txHash: orderSteps?.[3]?.transactionHash,
        isEth: false,
      },
    ];
  }, [type, isCrossIn, isCrossOut, orderSteps, tokenA?.symbol, tokenB?.symbol]);

  const currentIndex = useMemo(() => {
    for (let i = progress.length - 1; i >= 0; i--) {
      const p = progress[i];
      if (p.txHash) {
        return i;
      }
    }
    return 0;
  }, [progress]);

  return (
    <Container
      title={i18n.t('swap.progress.title')}
      footer={null}
      visible={stepModalVisable}
      onCancel={() => setStepModalVisable(false)}
      width="360px"
    >
      <section className="step">
        <Steps
          direction="vertical"
          size="small"
          current={currentIndex === progress.length - 1 ? currentIndex + 1 : currentIndex}
        >
          {progress.map((p, i) => {
            const title = p.txHash ? (
              <a target="_blank" rel="noopener noreferrer" href={buildURL(p.txHash, p.isEth)}>
                {p.title}
              </a>
            ) : (
              p.title
            );
            return (
              <Step className={i === 0 ? 'first' : ''} title={title} description={p.description} key={p.title + i} />
            );
          })}
        </Steps>
      </section>
      <MetaContainer>
        <Trans
          defaults="Normally your swap will complete successfully soon after <bold>step {{step}}</bold>, but if the price fluctuates above the slippage, your swap will be pending until the pool price fluctuates back to the price you submitted. You also have the option to cancel the operation if it takes too long." // optional defaultValue
          values={{ step: type === SwapOrderType.CrossChainOrder ? 3 : 2 }}
          components={{ bold: <strong /> }}
        />
      </MetaContainer>
    </Container>
  );
};
