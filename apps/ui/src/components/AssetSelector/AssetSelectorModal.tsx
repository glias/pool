import { Asset } from '@gliaswap/commons';
import { Modal } from 'antd';
import { ModalFuncProps } from 'antd/es/modal';
import i18n from 'i18n';
import React, { Key, useMemo } from 'react';
import styled from 'styled-components';
import { AssetList, AssetListProps } from './AssetList';
import { GroupedAssetList } from './GroupedAssetList';

const AssetSelectorModalWrapper = styled.div`
  .title {
    font-weight: bold;
    text-align: center;
    padding: 8px;
  }
`;

interface AssetSelectorModalProps<A extends Asset, K extends Key> extends AssetListProps<A, K>, ModalFuncProps {
  visible?: boolean;

  group?: (asset: A) => string;
}

export function AssetSelectorModal<A extends Asset, K extends Key>(props: AssetSelectorModalProps<A, K>) {
  const { assets, group, onSelected, disabledKeys, renderKey, ...modalProps } = props;

  const listElem = useMemo(() => {
    const assetListProps = { assets, onSelected, disabledKeys, renderKey };

    if (group) return <GroupedAssetList {...assetListProps} group={group} />;
    return <AssetList {...assetListProps} />;
  }, [assets, disabledKeys, group, onSelected, renderKey]);

  return (
    <Modal bodyStyle={{ padding: '16px' }} width={360} maskClosable footer={false} {...modalProps}>
      <AssetSelectorModalWrapper>
        <div className="title">{i18n.t('Select Token')}</div>
        {listElem}
      </AssetSelectorModalWrapper>
    </Modal>
  );
}
