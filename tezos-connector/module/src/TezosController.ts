import { TezosService } from './TezosService';
import { TezosError } from './TezosError';
import { Body, Get, Param, Post, Query } from '@nestjs/common';
import {
  BlockHeaderResponse,
  BlockResponse,
  ContractResponse,
  PreapplyResponse
} from '@taquito/rpc';
import { Wallet, TransferXtz } from '@tatumio/tatum';
import { GenerateWalletMnemonic } from './dto/GenerateWalletMnemonic';
import { GeneratePrivateKey } from './dto/GeneratePrivateKey';
import { GenerateAddress } from './dto/GenerateAddress';
import { GetTransactionsByAccountQuery } from './dto/GetTransactionsByAccountQuery';

function throwError(e) {
  throw new TezosError(
    `Unexpected error occurred. Reason: ${e.message || e.response.data || e}`,
    'tezos.error',
  );
}

export abstract class TezosController {
  protected constructor(protected readonly service: TezosService) { }

  @Get('/v3/tezos/info')
  async getInfo(): Promise<BlockHeaderResponse> {
    try {
      return await this.service.getBlockChainInfo();
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/tezos/block/:hash')
  async getBlock(@Param('hash') hash: string): Promise<BlockResponse> {
    try {
      return await this.service.getBlock(hash);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/tezos/account/:address')
  async getAccount(@Param('address') address: string): Promise<ContractResponse> {
    try {
      return await this.service.getAccount(address);
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/tezos/account/:address/transactions')
  async getTransactionsByAccount(
    @Param('address') address: string,
    @Query() query: GetTransactionsByAccountQuery,
  ): Promise<PreapplyResponse[]> {
    try {
      return await this.service.getTransactionsByAccount(
        address,
        query.pageSize,
        query.offset
      );
    } catch (e) {
      throwError(e);
    }
  }

  @Get('/v3/tezos/transaction/:hash')
  async getTransaction(@Param('hash') hash: string): Promise<PreapplyResponse> {
    try {
      return await this.service.getTransaction(hash);
    } catch (e) {
      throwError(e);
    }
  }

  @Post('/v3/tezos/wallet')
  async generateWallet(
    @Body() body: GenerateWalletMnemonic,
  ): Promise<Wallet> {
    try {
      return await this.service.generateWallet(body.mnemonic);
    } catch (e) {
      throwError(e);
    }
  }


  @Get('/v3/tezos/address/:xpub/:index')
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

  @Post('/v3/tezos/wallet/priv')
  async generatePrivateKey(
    @Body() body: GeneratePrivateKey,
  ): Promise<{ key: string }> {
    try {
      return await this.service.generatePrivateKey(body.mnemonic, body.index);
    } catch (e) {
      throwError(e);
    }
  }

  @Post('/v3/tezos/broadcast')
  async broadcast(
    @Body() txData: string,
    @Body('providerUrl') providerUrl?: string,
  ): Promise<{ txId: string }> {
    try {
      return await this.service.broadcast(txData, providerUrl);
    } catch (e) {
      throwError(e);
    }
  }

  @Post('/v3/tezos/transaction')
  async sendTransaction(
    @Body() body: TransferXtz,
    @Body('providerUrl') providerUrl?: string,
  ): Promise<{ txId: string }> {
    try {
      return await this.service.sendTransaction(body, providerUrl);
    } catch (e) {
      throwError(e);
    }
  }

}