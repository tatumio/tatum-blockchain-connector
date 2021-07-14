import {Body, Get, HttpCode, HttpStatus, Param, Post, Query,} from '@nestjs/common';
import {XdcService} from './XdcService';
import {QueryMnemonic} from './dto/QueryMnemonic';
import {GeneratePrivateKey} from './dto/GeneratePrivateKey';
import {PathXpubI} from './dto/PathXpubI';
import {
  BroadcastTx,
  EstimateGasEth,
  SmartContractMethodInvocation,
  SmartContractReadMethodInvocation,
  TransferErc20,
} from '@tatumio/tatum';
import {PathAddress} from './dto/PathAddress';
import {PathHash} from './dto/PathHash';
import {XdcError} from './XdcError';

export abstract class XdcController {
  protected constructor(protected readonly service: XdcService) {
  }

  @Post('v3/xdc/web3/:xApiKey')
  @HttpCode(HttpStatus.OK)
  public async web3Driver(@Body() body: any) {
    try {
      return await this.service.web3Method(body);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/wallet')
  @HttpCode(HttpStatus.OK)
  async generateWallet(@Query() { mnemonic }: QueryMnemonic) {
    try {
      return await this.service.generateWallet(mnemonic)
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Post('v3/xdc/wallet/priv')
  @HttpCode(HttpStatus.OK)
  async generatePrivateKey(@Body() { mnemonic, index }: GeneratePrivateKey) {
    try {
      return await this.service.generatePrivateKey(mnemonic, index)
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Post('v3/xdc/transaction')
  @HttpCode(HttpStatus.OK)
  public async sendXdcOrErc20Transaction(@Body() body: TransferErc20) {
    try {
      return await this.service.sendXdcOrErc20Transaction(body);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Post('v3/xdc/gas')
  @HttpCode(HttpStatus.OK)
  public async estimateGas(@Body() body: EstimateGasEth) {
    try {
      return await this.service.estimateGas(body);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/transaction/count/:address')
  @HttpCode(HttpStatus.OK)
  public async countTransactions(@Param() param: PathAddress) {
    try {
      return await this.service.getTransactionCount(param.address);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Post('v3/xdc/smartcontract')
  @HttpCode(HttpStatus.OK)
  public async invokeSmartContractMethod(@Body() body: SmartContractMethodInvocation | SmartContractReadMethodInvocation) {
    try {
      return await this.service.invokeSmartContractMethod(body);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Post('v3/xdc/broadcast')
  @HttpCode(HttpStatus.OK)
  public async broadcast(@Body() body: BroadcastTx) {
    try {
      return await this.service.broadcast(body.txData, body.signatureId);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/block/current')
  @HttpCode(HttpStatus.OK)
  public async getCurrentBlock() {
    try {
      return await this.service.getCurrentBlock();
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/block/:hash')
  @HttpCode(HttpStatus.OK)
  public async getBlock(@Param() path: PathHash) {
    try {
      return await this.service.getBlock(path.hash);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/account/balance/:address')
  @HttpCode(HttpStatus.OK)
  public async getAccountBalance(@Param() path: PathAddress) {
    try {
      return await this.service.getBalance(path.address);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/address/:xpub/:i')
  @HttpCode(HttpStatus.OK)
  public async generateAddress(@Param() { xpub, i }: PathXpubI) {
    try {
      return await this.service.generateAddress(xpub, i);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }

  @Get('v3/xdc/transaction/:hash')
  public async getTransaction(@Param() path: PathHash) {
    try {
      return await this.service.getTransaction(path.hash);
    } catch (e) {
      throw new XdcError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'xdc.error');
    }
  }
}
