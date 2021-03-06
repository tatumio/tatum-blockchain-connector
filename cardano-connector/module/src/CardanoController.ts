import { Block, Transaction, PaymentAddress } from '@cardano-graphql/client-ts';
import { Get, Post, Body, Param, Query } from '@nestjs/common';
import { Wallet, AdaUTxo, TransferAda } from '@tatumio/tatum';
import { CardanoError } from './CardanoError';
import { CardanoService } from './CardanoService';
import { CardanoBlockchainInfo } from './constants';
import { GenerateWalletMnemonic } from './dto/GenerateWalletMnemonic';
import { GenerateAddress } from './dto/GenerateAddress';
import { GeneratePrivateKey } from './dto/GeneratePrivateKey';
import { GetTransactionsByAccountQuery } from './dto/GetTransactionsByAccountQuery';

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

  @Post('/v3/cardano/wallet')
  async generateWallet(
    @Body() body: GenerateWalletMnemonic,
  ): Promise<Wallet> {
    try {
      return await this.service.generateWallet(body.mnemonic);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/block/:hash')
  async getBlock(@Param('hash') hash: string): Promise<Block> {
    try {
      return await this.service.getBlock(hash);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/transaction/:hash')
  async getTransaction(@Param('hash') hash: string): Promise<Transaction> {
    try {
      return await this.service.getTransaction(hash);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/account/:address')
  async getAccount(@Param('address') address: string): Promise<PaymentAddress> {
    try {
      return await this.service.getAccount(address);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/account/:address/transactions')
  async getTransactionsByAccount(
    @Param('address') address: string,
    @Query() query: GetTransactionsByAccountQuery,
  ): Promise<Transaction[]> {
    try {
      return await this.service.getTransactionsByAccount(
        address,
        query.pageSize,
        query.offset,
      );
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/address/:xpub/:index')
  async generateAddress(
    @Param() params: GenerateAddress,
  ): Promise<{ address: string }> {
    try {
      return await this.service.generateAddress(
        params.xpub,
        Number(params.index),
      );
    } catch (e) {
      throwError(e);
    }
  }

  @Post('/v3/cardano/wallet/priv')
  async generatePrivateKey(
    @Body() body: GeneratePrivateKey,
  ): Promise<{ key: string }> {
    try {
      return await this.service.generatePrivateKey(body.mnemonic, body.index);
    } catch (e) {
      throwError(e);
    }
  }

  @Post('/v3/cardano/broadcast')
  async broadcast(
    @Body('txData') txData: string
  ): Promise<{ txId: string }> {
    try {
      return await this.service.broadcast(txData);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/cardano/:address/utxos')
  async getUTxosByAddress(
    @Param('address') address: string
  ): Promise<AdaUTxo[]> {
    try {
      return await this.service.getUTxosByAddress(address);
    } catch (e) {
      throwError(e);
    }
  }

  @Post('/v3/cardano/transaction')
  async sendTransaction(
    @Body() body: TransferAda,
  ): Promise<{ txId: string }> {
    try {
      return await this.service.sendTransaction(body);
    } catch (e) {
      throwError(e);
    }
  }
}
