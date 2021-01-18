import { GliaswapProvider } from 'hooks/use-gliaswap';
import React from 'react';
import Routers from 'routes';
import './App.less';

const App: React.FC = () => {
  return (
    <GliaswapProvider>
      <Routers />
    </GliaswapProvider>
  );
};

export default App;
