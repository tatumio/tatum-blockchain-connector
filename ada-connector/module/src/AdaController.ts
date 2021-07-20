import { Block, Transaction, PaymentAddress } from '@cardano-graphql/client-ts';
import { Get, Post, Body, Param, Query } from '@nestjs/common';
import { AdaUtxo, TransferBtcBasedBlockchain } from '@tatumio/tatum';
import { AdaError } from './AdaError';
import { AdaService } from './AdaService';
import { AdaBlockchainInfo } from './constants';
import {
  BlockchainError,
  Pagination,
  PathHash,
  GeneratePrivateKey,
  PathAddress,
  QueryMnemonic,
  PathXpub,
  BtcBasedBlockchainControllerInterface,
  TxData,
  TransactionResponse,
  TransactionKMSResponse,
} from '@tatumio/blockchain-connector-common'

export abstract class AdaController implements BtcBasedBlockchainControllerInterface {
  protected constructor(protected readonly service: AdaService) {
  }

  @Get('/v3/ada/info')
  async getInfo(): Promise<AdaBlockchainInfo> {
    try {
      return await this.service.getBlockChainInfo();
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/wallet')
  async generateWallet(@Query() { mnemonic }: QueryMnemonic) {
    try {
      return await this.service.generateWallet(mnemonic);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/address/:xpub/:i')
  async generateAddress(@Param() { xpub, i }: PathXpub ): Promise<{ address: string }> {
    try {
      return await this.service.generateAddress(
        xpub,
        Number(i),
      );
    } catch (e) {
      this.throwError(e);
    }
  }

  @Post('/v3/ada/wallet/priv')
  async generatePrivateKey(@Body() body: GeneratePrivateKey): Promise<{ key: string }> {
    try {
      return await this.service.generatePrivateKey(body.mnemonic, body.index);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/block/:hash')
  async getBlock(@Param() path: PathHash): Promise<Block> {
    try {
      return await this.service.getBlock(path.hash);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/transaction/:hash')
  async getTransaction(@Param() path: PathHash): Promise<Transaction> {
    try {
      return await this.service.getTransaction(path.hash);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/account/:address')
  async getAccount(@Param() path: PathAddress): Promise<PaymentAddress> {
    try {
      return await this.service.getAccount(path.address);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/transaction/address/:address')
  async getTransactionsByAccount(@Param() path: PathAddress, @Query() query: Pagination): Promise<Transaction[]> {
    try {
      return await this.service.getTransactionsByAccount(
        path.address,
        query.pageSize,
        query.offset,
      );
    } catch (e) {
      this.throwError(e);
    }
  }


  @Post('/v3/ada/broadcast')
  async broadcast(
    @Body() txData : TxData
  ): Promise<{ txId: string }> {
    try {
      return await this.service.broadcast(txData);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Get('/v3/ada/:address/utxos')
  async getUTxosByAddress(@Param() path: PathAddress): Promise<AdaUtxo[]> {
    try {
      return await this.service.getUtxosByAddress(path.address);
    } catch (e) {
      this.throwError(e);
    }
  }

  @Post('/v3/ada/transaction')
  async sendTransaction(@Body() body: TransferBtcBasedBlockchain): Promise<TransactionResponse | TransactionKMSResponse> {
    try {
      return await this.service.sendTransaction(body);
    } catch (e) {
      this.throwError(e);
    }
  }

  throwError(e: BlockchainError): void {
    throw new AdaError(
      `Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`,
      'ada.error',
    );
  }

}
