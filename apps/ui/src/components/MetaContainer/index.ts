import styled from 'styled-components';

export const MetaContainer = styled.div`
  font-size: 12px;
  line-height: 14px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 2px;
  color: #000;
  .meta {
    display: flex;
    flex-direction: row;
    .image {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 10px;
      img {
        width: 54px;
      }
    }

    svg {
      rect {
        fill: url(#pattern0);
      }
    }
  }
  a {
    text-decoration: underline;
    color: #5c61da;
  }
`;
