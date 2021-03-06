import { isEthAsset, SwapOrderType } from '@gliaswap/commons';
import { Steps } from 'antd';
import { MetaContainer } from 'components/MetaContainer';
import { ModalContainer } from 'components/ModalContainer';
import { useGliaswap } from 'hooks';
import i18n from 'i18n';
import { cloneDeep } from 'lodash';
import React from 'react';
import { useMemo } from 'react';
import { Trans } from 'react-i18next';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { ETHER_SCAN_URL, EXPLORER_URL } from 'suite/constants';
import { useSwapContainer } from './context';

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
  activeTitle?: string;
  meta?: React.ReactNode;
  description?: string;
  txHash?: string;
  isEth: boolean;
}

export const StepModal = () => {
  const { stepModalVisable, setStepModalVisable, setAndCacheCrossChainOrders, currentOrder } = useSwapContainer();
  const { api } = useGliaswap();
  const type = currentOrder?.type!;
  const tokenA = currentOrder?.amountIn! ?? Object.create(null);
  const tokenB = currentOrder?.amountOut! ?? Object.create(null);
  const stageStatus = currentOrder?.stage.status;
  const orderSteps = useMemo(() => {
    return currentOrder?.stage.steps ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder?.stage.steps, currentOrder?.stage.steps.length]);

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
          activeTitle: i18n.t('swap.progress.confirming-eth'),
          description: `${i18n.t('swap.progress.lock')} ${tokenA.symbol.slice(2)}`,
          txHash: orderSteps?.[1]?.transactionHash,
          isEth: true,
        },
        {
          title: i18n.t('swap.progress.confirm-ckb'),
          activeTitle: i18n.t('swap.progress.confirming-ckb'),
          description: `${tokenA.symbol.slice(2)} ➜ ${tokenA.symbol}`,
          txHash: orderSteps?.[2]?.transactionHash,
          meta: (
            <Trans
              defaults="<bold>Step 3</bold> may take 5-15 minutes. It is necessary to wait for the confirmation of 15 blocks on the Ethereum to ensure the security."
              components={{ bold: <strong /> }}
            />
          ),
          isEth: false,
        },
        {
          title: i18n.t(stageStatus === 'canceling' ? 'actions.cancel-order' : 'swap.progress.sucess'),
          activeTitle: i18n.t(stageStatus === 'canceling' ? 'actions.canceling-order' : 'swap.progress.swapping'),
          description: `${tokenA.symbol} ➜ CKB`,
          txHash: orderSteps?.[3]?.transactionHash,
          isEth: false,
          meta:
            stageStatus === 'canceling' ? (
              <Trans
                defaults="Cancelling an operation will usually take roughly half of a minute. However, the cancellation could fail if it conflicts with the transaction from the deal-miner. Please notice that cancelling this swap will return the ETH cross-chain asset on Nervos(ck{{symbol}}) to you."
                values={{ symbol: tokenA.symbol }}
              />
            ) : (
              <Trans
                defaults="Normally your swap will complete successfully soon after <bold>step 3</bold>, but if the price fluctuates above the slippage, your swap will be pending until the pool price fluctuates back to the price you submitted. Please be notice if canceling this swap, you will receive the ETH cross-chain asset on CKB - ck{{symbol}}."
                values={{ symbol: tokenA.symbol }}
                components={{ bold: <strong /> }}
              />
            ),
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
          activeTitle: i18n.t('swap.progress.confirming-eth'),
          description: `${i18n.t('swap.progress.lock')} ${tokenA.symbol}`,
          txHash: orderSteps?.[1]?.transactionHash,
          isEth: true,
        },
        {
          title: i18n.t('swap.progress.sucess'),
          activeTitle: i18n.t('swap.progress.swapping'),
          meta: i18n.t('swap.swap-modal.cross-time', { chain: 'Ethereum' }),
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
          title: i18n.t('swap.progress.confirm-ckb'),
          activeTitle: i18n.t('swap.progress.confirming-ckb'),
          description: `${i18n.t('swap.progress.burn')} ${tokenA.symbol}`,
          txHash: orderSteps?.[1]?.transactionHash,
          isEth: false,
        },
        {
          title: i18n.t('swap.progress.sucess'),
          activeTitle: i18n.t('swap.progress.swapping'),
          meta: i18n.t('swap.swap-modal.cross-time', { chain: 'Nervos' }),
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
        activeTitle: i18n.t('swap.progress.confirming-ckb'),
        description: `${i18n.t('swap.progress.lock')} ${tokenA.symbol}`,
        txHash: orderSteps?.[1]?.transactionHash,
        isEth: false,
      },
      {
        title: i18n.t(
          stageStatus === 'canceling' || stageStatus === 'canceled' ? 'actions.cancel-order' : 'swap.progress.sucess',
        ),
        activeTitle: i18n.t(stageStatus === 'canceling' ? 'actions.canceling-order' : 'swap.progress.swapping'),
        description: `${tokenA.symbol} ➜ ${tokenB.symbol}`,
        txHash: orderSteps?.[2]?.transactionHash,
        isEth: false,
        meta:
          stageStatus === 'canceling' ? (
            <Trans defaults="Cancelling an operation will usually take roughly half of a minute. However, the cancellation could fail if it conflicts with the transaction from the deal-miner." />
          ) : (
            <Trans
              defaults="Normally your swap will complete successfully soon after <bold>step 2</bold>, but if the price fluctuates above the slippage, your add liquidity request will be pending until the pool price fluctuates back to the price you submitted. You also have the option to cancel the operation if it takes too long."
              components={{ bold: <strong /> }}
            />
          ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isCrossIn, isCrossOut, orderSteps, tokenA?.symbol, tokenB?.symbol, stageStatus, orderSteps.length]);

  const currentIndex = useMemo(() => {
    for (let i = progress.length - 1; i >= 0; i--) {
      const p = progress[i];
      if (p.txHash) {
        return i;
      }
    }
    return 0;
  }, [progress]);

  const shouldCheckCkbStatus = useMemo(() => {
    const isCrossChainOrder = currentOrder?.type === SwapOrderType.CrossChainOrder;
    const isFirstStep = currentOrder?.stage?.steps.length === 1;
    return (
      stepModalVisable && currentOrder?.stage.status === 'pending' && (isCrossChainOrder || isCrossOut) && isFirstStep
    );
  }, [stepModalVisable, currentOrder?.stage.status, currentOrder?.type, isCrossOut, currentOrder?.stage?.steps]);

  useQuery(
    ['check-ckb-tx-status', shouldCheckCkbStatus, stepModalVisable, currentOrder?.transactionHash],
    () => {
      return api.ckb.rpc.getTransaction(currentOrder?.transactionHash!);
    },
    {
      enabled: stepModalVisable && shouldCheckCkbStatus && !!api.ckb && !!currentOrder?.transactionHash,
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
      refetchOnMount: true,
      onSuccess: (res) => {
        if (res?.txStatus?.status === 'committed') {
          setAndCacheCrossChainOrders((orders) => {
            return orders.map((o) => {
              const order = cloneDeep(o);
              const txhash = res?.transaction?.hash;
              const isMatched = order.stage.steps.some((s) => s.transactionHash === txhash);
              const step = {
                transactionHash: res?.transaction?.hash,
                errorMessage: '',
                index: '0x',
              };
              if (order.type === SwapOrderType.CrossChainOrder && isMatched) {
                order.stage.steps[2] = step;
              }
              if (order.type === SwapOrderType.CrossChain && isMatched) {
                order.stage.steps[1] = step;
              }
              return order;
            });
          });
        }
      },
    },
  );

  return (
    <Container
      title={i18n.t('swap.progress.title')}
      footer={null}
      visible={stepModalVisable}
      onCancel={() => setStepModalVisable(false)}
      width="360px"
    >
      <section className="step">
        <Steps direction="vertical" size="small" current={currentIndex + 1}>
          {progress.map((p, i) => {
            const isCurrentIndex = i === currentIndex + 1 || (stageStatus === 'canceling' && i === currentIndex);
            const titleText = isCurrentIndex ? p.activeTitle : p.title;
            const title = p.txHash ? (
              <a target="_blank" rel="noopener noreferrer" href={buildURL(p.txHash, p.isEth)}>
                {titleText}
              </a>
            ) : (
              titleText
            );
            const description = isCurrentIndex ? (
              <>
                <span>{p.description}</span>
                {p.meta ? <MetaContainer>{p.meta}</MetaContainer> : null}
              </>
            ) : (
              p.description
            );
            return (
              <Step className={i === 0 ? 'first' : ''} title={title} description={description} key={p.title + i} />
            );
          })}
        </Steps>
      </section>
    </Container>
  );
};
