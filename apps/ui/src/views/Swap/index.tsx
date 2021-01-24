import React from 'react';
import { ViewContainer } from 'views/styled';
import { SwapTable } from './SwapTable';
import { SwapList } from './SwapList';
import { SwapProvider } from './hook';
import { CancelModal } from './CancelModal';
import { SwapModal } from './SwapModal';

const SwapView: React.FC = () => {
  return (
    <SwapProvider>
      <ViewContainer>
        <SwapTable />
        <SwapList />
      </ViewContainer>
      <CancelModal />
      <SwapModal />
    </SwapProvider>
  );
};

export default SwapView;
