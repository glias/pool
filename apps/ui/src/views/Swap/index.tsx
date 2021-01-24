import React from 'react';
import { ViewContainer } from 'views/styled';
import { SwapTable } from './SwapTable';
import { SwapList } from './SwapList';

const SwapView: React.FC = () => {
  return (
    <ViewContainer>
      <SwapTable />
      <SwapList />
    </ViewContainer>
  );
};

export default SwapView;
