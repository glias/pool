import { Modal } from 'antd';
import i18n from 'i18n';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Asset } from '../../commons/MultiAsset';
import { AssetList, AssetListProps } from './AssetList';
import { GroupedAssetList } from './GroupedAssetList';

const AssetSelectorModalWrapper = styled.div`
  .title {
    font-weight: bold;
    text-align: center;
    padding: 8px;
  }
`;

interface AssetSelectorModalProps extends AssetListProps, React.ComponentProps<typeof Modal> {
  visible?: boolean;

  group?: (asset: Asset) => string;
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = (props) => {
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
};
