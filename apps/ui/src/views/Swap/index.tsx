import React from 'react';
import { CancelModal } from './CancelModal';
import { StepModal } from './StepModal';
import { SwapList } from './SwapList';
import { SwapModal } from './SwapModal';
import { SwapTable } from './SwapTable/index';
import { SwapProvider } from './context';

const SwapView: React.FC = () => {
  return (
    <SwapProvider>
      <>
        <SwapTable />
        <SwapList />
      </>
      <CancelModal />
      <SwapModal />
      <StepModal />
    </SwapProvider>
  );
};

export default SwapView;
