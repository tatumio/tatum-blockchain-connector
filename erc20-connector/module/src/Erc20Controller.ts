import { BadRequestException, Body, Param, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Erc20Service } from './Erc20Service';
import { Erc20Error } from './Erc20Error';
import {
    BurnEthErc20,
    DeployEthErc20,
    MintErc20,
    TransferEthErc20,
    // EthGetBalance,
    TransferBscBep20,
    BurnCeloErc20,
    DeployCeloErc20,
    MintCeloErc20,
    // CeloTransferErc20,
    // CeloGetBalance,
    TransferCeloOrCeloErc20Token,
    TransferTronTrc20,
    CreateTronTrc20,
  } from '@tatumio/tatum';
import { PathAddressContractAddressChain } from './dto/PathAddressContractAddressChain';
// import { PathTokenIdContractAddressChain } from './dto/PathTokenIdContractAddressChain';
// import { PathChainTxId } from './dto/PathChainTxId';
import { PathChain } from './dto/PathChain';

export abstract class Erc20Controller {
    protected constructor(protected readonly service: Erc20Service) {
    }

    @Get('/v3/blockchain/token/balance/:chain/:contractAddress/:address')
    public async getBalanceErc20(@Param() path: PathAddressContractAddressChain) {
        try {
            return await this.service.getErc20Balance(path.chain, path.address, path.contractAddress)
        } catch (e) {
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'erc20.error');
        }
    }

    @Post('/v3/blockchain/token/:chain/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc20(
      @Param() path: PathChain, @Body() body: TransferEthErc20 | TransferBscBep20 | TransferCeloOrCeloErc20Token | TransferTronTrc20
    ) {
        try {
            return await this.service.transferErc20(path.chain, body);
        } catch (e) {
            if (e.constructor.name === 'Array' || e.constructor.name === 'ValidationError') {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'Erc20Error') {
                throw new BadRequestException(e);
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'erc20.error');
        }
    }

    @Post('/v3/blockchain/token/:chain/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc20(@Param() path: PathChain, @Body() body: BurnEthErc20 | BurnCeloErc20) {
        try {
            return await this.service.burnErc20(path.chain, body);
        } catch (e) {
            if (e.constructor.name === 'Array' || e.constructor.name === 'ValidationError') {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'Erc20Error') {
                throw new BadRequestException(e);
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'erc20.error');
        }
    }

    @Post('/v3/blockchain/token/:chain/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc20(@Param() path: PathChain, @Body() body: MintErc20 | MintCeloErc20) {
        try {
            return await this.service.mintErc20(path.chain, body);
        } catch (e) {
            if (e.constructor.name === 'Array' || e.constructor.name === 'ValidationError') {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'Erc20Error') {
                throw new BadRequestException(e);
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'erc20.error');
        }
    }

    @Post('/v3/blockchain/token/:chain/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc20(@Param() path: PathChain, @Body() body: DeployEthErc20 | DeployCeloErc20 | CreateTronTrc20) {
        try {
            return await this.service.deployErc20(path.chain, body);
        } catch (e) {
            if (e.constructor.name === 'Array' || e.constructor.name === 'ValidationError') {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'Erc20Error') {
                throw new BadRequestException(e);
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'erc20.error');
        }
    }
}
