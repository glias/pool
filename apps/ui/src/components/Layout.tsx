import styled from 'styled-components';

interface SectionProps {
  transparent?: boolean;
  bordered?: boolean;
}

export const Section = styled.div<SectionProps>`
  border-radius: 16px;
  padding: 16px;
  margin: 16px 0px;
  background: ${(props) => (props.transparent ? '' : '#fff')};
  border: ${(props) => (props.bordered ? '1px solid #e1e1e1' : '')};
`;

export const SpaceBetweenRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
  line-height: 1;

  .label {
    font-weight: bold;
    color: #7e7e7e;
  }
`;
