import { HttpException } from '@nestjs/common';

export class AdaError extends HttpException {
  constructor(message: string, errorCode: string, statusCode = 403) {
    super({ message, errorCode, statusCode }, statusCode);
  }
}
