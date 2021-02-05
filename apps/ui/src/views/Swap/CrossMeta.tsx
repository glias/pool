import React from 'react';
import { MetaContainer } from 'components/MetaContainer';
import Gift from 'assets/img/gift.png';
import { SWAP_CELL_ASK_CAPACITY, SWAP_CELL_BID_CAPACITY } from 'suite/constants';
import i18n from 'i18n';
import { SwapMode } from './context';

export const CrossMeta = ({ swapMode, isBid }: { swapMode: SwapMode; isBid: boolean }) => {
  const amount = swapMode === SwapMode.CrossIn ? '142' : !isBid ? SWAP_CELL_ASK_CAPACITY : SWAP_CELL_BID_CAPACITY;
  return (
    <MetaContainer>
      <div className="meta">
        <div className="image">
          <img src={Gift} alt="" />
        </div>
        <div>
          {i18n.t('swap.swap-modal.cross-meta', {
            amount,
          })}
        </div>
      </div>
    </MetaContainer>
  );
};
