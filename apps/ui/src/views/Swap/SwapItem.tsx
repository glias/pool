import React from 'react';
import { Button, List } from 'antd';
import i18n from 'i18n';
import { SwapOrder, GliaswapAssetWithBalance, SwapOrderType, isShadowEthAsset } from '@gliaswap/commons';
import styled from 'styled-components';
import { TableRow } from 'components/TableRow';
import { calcCrossIn, displayBalance, formatTimestamp } from 'utils';
import { AssetSymbol } from 'components/Asset';
import { useMemo } from 'react';
import { ReactComponent as InfoSvg } from 'assets/svg/info.svg';
import { ReactComponent as ArrowSvg } from 'assets/svg/right-arrow.svg';
import { useSwapContainer } from './context';
import { useCallback } from 'react';

const RightArrow = styled.span`
  width: 12px;
  height: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 4px;
  margin-right: 4px;
`;

export const ItemContainer = styled.div`
  width: 100%;
  > div {
    margin-bottom: 12px;
  }
  button {
    color: #5c61da;
    font-size: 12px;
    border-radius: 2px;
    height: 24px;
    padding: 1px 8px;
    &:last-child {
      margin-left: 8px;
      position: relative;
      top: -1px;
      padding: 1px 6px;
      width: 24px;
    }
  }
  .route {
    display: flex;
    flex-direction: row;
    .icon {
      width: 14px;
      height: 14px;
      img {
        width: 10px;
        height: 10px;
      }
    }
  }
`;

export const Route = ({
  tokenA,
  tokenB,
  orderType,
}: {
  tokenA: GliaswapAssetWithBalance;
  tokenB: GliaswapAssetWithBalance;
  orderType: SwapOrderType;
}) => {
  let shadowAsset = null;
  if (orderType === SwapOrderType.CrossChainOrder && isShadowEthAsset(tokenA)) {
    shadowAsset = <AssetSymbol asset={tokenA.shadowFrom} />;
  }
  return (
    <span className="route">
      {shadowAsset}
      {shadowAsset ? (
        <RightArrow>
          <ArrowSvg />
        </RightArrow>
      ) : null}
      <AssetSymbol asset={tokenA} />
      <RightArrow>
        <ArrowSvg />
      </RightArrow>
      <AssetSymbol asset={tokenB} />
    </span>
  );
};

export const Balanced = ({ asset }: { asset: GliaswapAssetWithBalance }) => {
  const balance = displayBalance(asset);
  return (
    <span className="balance">
      {balance} {asset.symbol}
    </span>
  );
};

export const SwapItem = ({ order }: { order: SwapOrder }) => {
  const { setCancelModalVisable, setStepModalVisable, setCurrentOrderTxHash } = useSwapContainer();
  const timestamp = formatTimestamp(order.timestamp);
  const route = <Route tokenA={order.amountIn} tokenB={order.amountOut} orderType={order.type} />;
  const pay = <Balanced asset={order.amountIn} />;
  const receive = (
    <Balanced
      asset={
        order.type === SwapOrderType.CrossChain && isShadowEthAsset(order.amountIn)
          ? {
              ...order.amountOut,
              balance:
                order.stage.status !== 'pending' ? calcCrossIn(order.amountOut.balance) : order.amountOut.balance,
            }
          : order.amountOut
      }
    />
  );
  const { status } = order.stage;
  const { type } = order;

  const openCancelModal = useCallback(() => {
    setCurrentOrderTxHash(order.stage.steps[0].transactionHash);
    setCancelModalVisable(true);
  }, [setCancelModalVisable, setCurrentOrderTxHash, order]);

  const openStepModal = useCallback(() => {
    setCurrentOrderTxHash(order.stage.steps[0].transactionHash);
    setStepModalVisable(true);
  }, [setStepModalVisable, setCurrentOrderTxHash, order]);

  const action = useMemo(() => {
    const cancelBtn =
      status === 'pending' ? (
        <Button type="default" disabled loading>
          {i18n.t('actions.pending')}
        </Button>
      ) : type !== SwapOrderType.CrossChain ? (
        <Button
          type="default"
          loading={status === 'canceling'}
          disabled={status === 'canceling'}
          onClick={openCancelModal}
        >
          {i18n.t('actions.cancel')}
        </Button>
      ) : null;
    return (
      <>
        {order.stage.status === 'completed' || order.stage.status === 'canceled' ? null : cancelBtn}
        <Button type="default" icon={<InfoSvg />} onClick={openStepModal} />
      </>
    );
  }, [status, type, openCancelModal, openStepModal, order.stage.status]);

  return (
    <List.Item>
      <ItemContainer>
        <TableRow label={i18n.t('swap.order-list.time')} value={timestamp} />
        <TableRow label={i18n.t('swap.order-list.route')} value={route} />
        <TableRow label={i18n.t('swap.order-list.pay')} value={pay} />
        <TableRow label={i18n.t('swap.order-list.receive')} value={receive} />
        <TableRow label="" value={action} />
      </ItemContainer>
    </List.Item>
  );
};
