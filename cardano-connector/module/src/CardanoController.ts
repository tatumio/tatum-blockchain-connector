import { Get, Post, Body, Param } from '@nestjs/common';
import { CardanoError } from './CardanoError';
import { CardanoService } from './CardanoService';
import { CardanoBlockchainInfo, CardanoBlockInfo, CardanoTransactionInfo } from './constants';
import { GenerateWalletMnemonic } from './dto/GenerateWalletMnemonic';

function throwError(e) {
  throw new CardanoError(
    `Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`,
    'cardano.error',
  );
}

export abstract class CardanoController {
  protected constructor(protected readonly service: CardanoService) {}

  @Get('/v3/cardano/info')
  async getInfo(): Promise<CardanoBlockchainInfo> {
    try {
      return await this.service.getBlockChainInfo();
    } catch (e) {
      throwError(e);
    }
  }

  @Post('v3/cardano/wallet')
  async generateWallet(@Body() body: GenerateWalletMnemonic): Promise<string> {
    try {
      return await this.service.generateWallet(body);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/block/info/:hash')
  async getBlockInfoByHash(@Param('hash') hash): Promise<CardanoBlockInfo> {
    try {
      return await this.service.getBlockInfoByHash(hash);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/transaction/info/:hash')
  async getTransactinInfoByHash(@Param('hash') hash): Promise<CardanoTransactionInfo> {
    try {
      return await this.service.getTransactionInfoByHash(hash);
    } catch (e) {
      throwError(e);
    }
  }
}
