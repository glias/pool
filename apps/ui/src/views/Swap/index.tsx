import React from 'react';
import { ViewContainer } from 'views/styled';
import { SwapTable } from './SwapTable/index';
import { SwapList } from './SwapList';
import { SwapProvider } from './context';
import { CancelModal } from './CancelModal';
import { SwapModal } from './SwapModal';
import { StepModal } from './StepModal';

const SwapView: React.FC = () => {
  return (
    <SwapProvider>
      <ViewContainer>
        <SwapTable />
        <SwapList />
      </ViewContainer>
      <CancelModal />
      <SwapModal />
      <StepModal />
    </SwapProvider>
  );
};

export default SwapView;
