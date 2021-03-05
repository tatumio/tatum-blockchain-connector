import { Block, Transaction } from '@cardano-graphql/client-ts';
import { Get, Post, Body, Param } from '@nestjs/common';
import { CardanoError } from './CardanoError';
import { CardanoService } from './CardanoService';
import { CardanoBlockchainInfo } from './constants';
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

  @Get('/v3/cardano/block/:hash')
  async getBlockInfoByHash(@Param('hash') hash): Promise<Block> {
    try {
      return await this.service.getBlock(hash);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/transaction/:hash')
  async getTransactinInfoByHash(@Param('hash') hash): Promise<Transaction> {
    try {
      return await this.service.getTransaction(hash);
    } catch (e) {
      throwError(e);
    }
  }
}
