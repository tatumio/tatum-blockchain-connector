import { Get } from '@nestjs/common';
import { CardanoError } from './CardanoError';
import { CardanoService } from './CardanoService';
import { CardanoBlockchainInfo } from './constants';

export abstract class CardanoController {
  protected constructor(protected readonly service: CardanoService) {}

  @Get('/v3/cardano/info')
  async getInfo(): Promise<CardanoBlockchainInfo> {
    try {
      return await this.service.getBlockChainInfo();
    } catch (e) {
      throw new CardanoError(
        `Unexpected error occurred. Reason: ${
          e.message || e.response?.data || e
        }`,
        'cardano.error',
      );
    }
  }
}
