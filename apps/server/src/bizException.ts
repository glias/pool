export class BizException extends Error {
  constructor(msg = '', errCode = 400, httpCode = 400) {
    super(msg);
  }
}
