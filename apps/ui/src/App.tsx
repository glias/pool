import { testNet } from '@gliaswap/constants';
import React from 'react';
import './App.css';

const App: React.FC = () => {
  return <div className="App">{testNet.SUDT_TYPE_CODE_HASH}</div>;
};

export default App;
