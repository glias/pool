import React from 'react';
import { MetaContainer } from 'components/MetaContainer';
import Gift from 'assets/img/gift.png';
import { SWAP_CELL_ASK_CAPACITY, SWAP_CELL_BID_CAPACITY, README_URL } from 'suite/constants';
import i18n from 'i18n';

export const CrossMeta = ({ pureCross, isBid }: { pureCross: boolean; isBid: boolean }) => {
  return (
    <MetaContainer>
      <div className="meta">
        <div className="image">
          <img src={Gift} alt="" />
        </div>
        <div>
          {i18n.t('swap.swap-modal.cross-meta', {
            amount: pureCross ? '142' : isBid ? SWAP_CELL_ASK_CAPACITY : SWAP_CELL_BID_CAPACITY,
          })}
          <a
            href={`${README_URL}#why-lock-my-addtional-ckb-when-i-place-an-order`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {i18n.t('swap.swap-modal.learn-why')}
          </a>
        </div>
      </div>
    </MetaContainer>
  );
};
