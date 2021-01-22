import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { RadioItem, RadioTabs } from 'components/AssetManager/components/RadioTabs';
import { TransactionList } from 'components/AssetManager/TransactionList';
import { AssetList } from 'components/AssetManager/AssetBalance/TokenList';

export const TokenTabs: React.FC = () => {
  const { hash } = useLocation();
  const { replace } = useHistory();
  const match = useRouteMatch();
  const { t } = useTranslation();

  const activatedTab = hash.substring(1);

  function setActivatedTab(tab: string) {
    replace(`${match.url}#${tab}`);
  }

  useEffect(() => {
    if (!activatedTab) replace(`${match.url}#assets`);
  }, [activatedTab, match.url, replace]);

  const tabContent = activatedTab === 'assets' ? <AssetList /> : <TransactionList />;
  // const tabContent = <AssetList />;

  return (
    <>
      <RadioTabs style={{ height: '40px' }} onChange={(selected) => setActivatedTab(selected)} value={activatedTab}>
        <RadioItem key="assets">{t('Assets')}</RadioItem>
        <RadioItem key="transactions">{t('Transactions')}</RadioItem>
      </RadioTabs>
      {tabContent}
    </>
  );
};
