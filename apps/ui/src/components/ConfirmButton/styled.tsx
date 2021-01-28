import styled from 'styled-components';

function shadeColor(color: string, percent = 15) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(((R * (100 + percent)) / 100).toString(), 10);
  G = parseInt(((G * (100 + percent)) / 100).toString(), 10);
  B = parseInt(((B * (100 + percent)) / 100).toString(), 10);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).length === 1 ? `0${R.toString(16)}` : R.toString(16);
  const GG = G.toString(16).length === 1 ? `0${G.toString(16)}` : G.toString(16);
  const BB = B.toString(16).length === 1 ? `0${B.toString(16)}` : B.toString(16);

  return `#${RR}${GG}${BB}`;
}

export type HexString = string;

export const ButtonContainer = styled.div`
  button {
    background-color: ${(props: { bgColor?: HexString }) => props.bgColor ?? '#5C61DA;'};
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 2px;
    height: 32px;
    color: white;
    text-align: center;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;
    width: 100%;
    padding: 5px 16px;
    &.ant-btn-text {
      &.ant-btn-loading {
        color: white !important;
        background-color: ${(props: { bgColor?: HexString }) => `${shadeColor(props.bgColor ?? '#5C61DA')}!important`};
      }
      &.ant-btn {
        &:disabled {
          background-color: #b8b9d6;
          color: white;
        }
      }
      &:active {
        color: white;
        background-color: ${(props: { bgColor?: HexString }) => shadeColor(props.bgColor ?? '#5C61DA;')};
      }
      &:focus {
        color: white;
        background-color: ${(props: { bgColor?: HexString }) => shadeColor(props.bgColor ?? '#5C61DA;')};
      }
      &:hover {
        color: white;
        background-color: ${(props: { bgColor?: HexString }) => shadeColor(props.bgColor ?? '#5C61DA;')};
      }
    }
    &.loading {
      opacity: 0.8;
    }
  }
`;
