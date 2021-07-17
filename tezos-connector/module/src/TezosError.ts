import { HttpException } from '@nestjs/common';

export class TezosError extends HttpException {
  constructor(message: string, errorCode: string, statusCode = 403) {
    super({ message, errorCode, statusCode }, statusCode);
  }
}
