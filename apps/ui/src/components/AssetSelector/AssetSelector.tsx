import { Asset } from '@gliaswap/commons';
import { Button } from 'antd';
import { ReactComponent as TriangleSvg } from 'assets/svg/triangle.svg';
import { AssetSymbol } from 'components/Asset';
import React, { Key, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AssetListProps } from './AssetList';
import { AssetSelectorModal } from './AssetSelectorModal';

interface WrapperProps {
  selectable?: boolean;
  bold?: boolean;
}

const TokenSelectorWrapper = styled.span<WrapperProps>`
  display: inline-flex;
  align-items: center;
  font-weight: ${(props) => (props.bold ? 'bold' : 'normal')};
  color: rgba(0, 0, 0, 0.85);

  ${(props) =>
    props.selectable &&
    `cursor: pointer;
    border-radius: 10px;
    padding: 6px;
    :hover {
      background: ${props.theme.primary || '#eee'};
    }`}
  .action {
    margin-left: 8px;
  }
`;

export interface TokenSelectorProps<T extends Asset, K extends Key> extends AssetListProps<T, K> {
  /**
   * the current selected asset
   */
  selectedKey?: K;

  group?: (asset: T) => string;

  bold?: boolean;
}

export function AssetSelector<A extends Asset, K extends Key>(
  props: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>> & TokenSelectorProps<A, K>,
) {
  const {
    selectedKey,
    onSelected,
    assets,
    renderKey,
    group,
    disabledKeys,
    children,
    enableSearch,
    balanceCaculator,
    ...otherProps
  } = props;
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
    (key: K, asset) => {
      Promise.resolve(onSelected?.(key, asset)).then(() => setModalVisible(false));
    },
    [onSelected],
  );

  const onClick = useCallback(
    (e: React.MouseEvent<any, MouseEvent>) => {
      e.stopPropagation();
      if (!selectable) return;
      setModalVisible(true);
    },
    [selectable],
  );

  const buttonElem = useMemo(() => {
    if (children) {
      return (
        <span {...otherProps} onClick={onClick}>
          {children}
        </span>
      );
    }

    if (selectedAsset) {
      return (
        <TokenSelectorWrapper {...otherProps} selectable={selectable} onClick={onClick}>
          <AssetSymbol asset={selectedAsset} />
          <TriangleSvg className="action" />
        </TokenSelectorWrapper>
      );
    }

    if (selectable)
      return (
        <Button {...otherProps} onClick={onClick} type="primary">
          Select a token
        </Button>
      );
    return null;
  }, [children, onClick, otherProps, selectable, selectedAsset]);

  const modalElem = useMemo(() => {
    if (!selectable) return;
    return (
      <AssetSelectorModal
        onCancel={() => setModalVisible(false)}
        visible={modalVisible}
        assets={assets}
        balanceCaculator={balanceCaculator}
        onSelected={onSelect}
        renderKey={renderKey}
        enableSearch={enableSearch}
        group={group}
        disabledKeys={disabledKeys ? disabledKeys : selectedAsset ? ([selectedKey] as K[]) : undefined}
      />
    );
  }, [
    selectable,
    assets,
    modalVisible,
    onSelect,
    renderKey,
    group,
    selectedAsset,
    selectedKey,
    disabledKeys,
    enableSearch,
    balanceCaculator,
  ]);

  return (
    <>
      {modalElem}
      {buttonElem}
    </>
  );
}
