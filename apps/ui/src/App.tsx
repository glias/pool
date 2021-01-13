import { AppHeader } from 'components/Header';
import { GliaswapProvider } from 'hooks/use-gliaswap';
import React, { useEffect } from 'react';
import { BrowserRouter, useHistory, useLocation } from 'react-router-dom';
import { Main } from 'views';
import './App.less';

const AppContent = () => {
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    const [, currentModule] = location.pathname.split('/');
    if (!currentModule) history.replace('/swap');
  }, [location.pathname, history]);

  return (
    <>
      <AppHeader />
      <Main />
    </>
  );
};

const App: React.FC = () => {
  return (
    <GliaswapProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GliaswapProvider>
  );
};

export default App;
