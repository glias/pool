export class BizException extends Error {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(msg = '', errCode = 400, httpCode = 400) {
    super(msg);
  }
}
