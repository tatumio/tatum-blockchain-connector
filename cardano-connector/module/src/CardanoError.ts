import { HttpException } from '@nestjs/common';

export class CardanoError extends HttpException {
  constructor(message: string, errorCode: string, statusCode = 403) {
    super({ message, errorCode, statusCode }, statusCode);
  }
}
