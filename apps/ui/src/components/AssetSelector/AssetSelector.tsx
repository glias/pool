import { DownOutlined } from '@ant-design/icons';
import { Asset } from '@gliaswap/commons';
import { AssetSymbol } from 'components/Asset';
import React, { Key, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AssetListProps } from './AssetList';
import { AssetSelectorModal } from './AssetSelectorModal';

interface WrapperProps {
  selectable?: boolean;
}

const TokenSelectorWrapper = styled.span<WrapperProps>`
  display: inline-flex;
  align-items: center;

  ${(props) =>
    props.selectable &&
    `cursor: pointer; 
    border-radius: 10px; 
    padding: 6px;
    :hover { 
      background: ${props.theme.primary || '#eee'};
    }`}
  .action {
    margin-left: 4px;
  }
`;

export interface TokenSelectorProps<T extends Asset, K extends Key> extends AssetListProps<T, K> {
  /**
   * the current selected asset
   */
  selectedKey?: K;

  group?: (asset: T) => string;
}

export function AssetSelector<A extends Asset, K extends Key>(props: TokenSelectorProps<A, K>) {
  const { selectedKey, onSelected, assets, renderKey, disabledKeys, group, ...otherProps } = props;
  const [modalVisible, setModalVisible] = useState(false);

  const selectable = !!onSelected;

  const selectedAsset = useMemo(
    () =>
      assets.find((item, i) => {
        if (!selectedKey == null) return null;
        return renderKey(item, i, assets) === selectedKey;
      }),
    [selectedKey, assets, renderKey],
  );

  const onSelect = useCallback(
    (key: K) => {
      onSelected?.(key, selectedAsset!);
      setModalVisible(false);
    },
    [onSelected, selectedAsset],
  );

  const buttonElem = useMemo(() => {
    if (selectedAsset) {
      return (
        <>
          <AssetSymbol asset={selectedAsset} />
          <DownOutlined className="action" />
        </>
      );
    }

    if (selectable) return 'Select a token';
    return null;
  }, [selectable, selectedAsset]);

  const modalElem = useMemo(() => {
    if (!selectable) return;

    return (
      <AssetSelectorModal
        onCancel={() => setModalVisible(false)}
        visible={modalVisible}
        assets={assets}
        onSelected={onSelect}
        renderKey={renderKey}
        group={group}
        disabledKeys={selectedAsset ? ([selectedKey] as K[]) : undefined}
      />
    );
  }, [selectable, assets, modalVisible, onSelect, renderKey, group, selectedAsset, selectedKey]);

  const onClick = useCallback(() => {
    if (!selectable) return;
    setModalVisible(true);
  }, [selectable]);

  return (
    <>
      {modalElem}
      <TokenSelectorWrapper {...otherProps} selectable={selectable} onClick={onClick}>
        {buttonElem}
      </TokenSelectorWrapper>
    </>
  );
}
