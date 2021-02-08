import { Button, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
const cheet = require('./cheet');

const TEMP_PASSWORD = `gliaswap`;

export const ProtectionModal: React.FC = () => {
  const [entryPassword, setEntryPassword] = useState('');
  const [modalVisable, setModalVisable] = useState(localStorage.getItem(TEMP_PASSWORD) !== TEMP_PASSWORD);

  const unlock = () => {
    setModalVisable(false);
    localStorage.setItem(TEMP_PASSWORD, TEMP_PASSWORD);
  };

  useEffect(() => {
    cheet('↑ ↑ ↓ ↓ ← → ← → b a', unlock);
  }, []);

  const modalFooter = (
    <Button type="primary" disabled={entryPassword !== TEMP_PASSWORD} onClick={unlock}>
      Unlock
    </Button>
  );

  return (
    <Modal visible={modalVisable} keyboard={false} closable={false} footer={modalFooter}>
      <div>
        <h3>Please enter the Internal Test Code:</h3>
        <Input value={entryPassword} type="password" onChange={(e) => setEntryPassword(e.target.value)} />
        <div style={{ marginTop: '8px' }}>
          The Demo App is currently under internal testing, so please be aware of the risks when trading your assets. If
          you have any questions or suggestions when testing, please submit a issue at&nbsp;
          <a
            style={{ color: 'blue' }}
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/glias/pool/issues"
          >
            GitHub
          </a>
          .
        </div>
      </div>
    </Modal>
  );
};
