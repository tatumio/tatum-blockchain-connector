import { BadRequestException, Body, Param, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Erc20Service } from './Erc20Service';
import { Erc20Error } from './Erc20Error';
import {
    ChainBurnErc20,
    ChainDeployErc20,
    ChainMintErc20,
    ChainTransferEthErc20,
    ChainTransferBscBep20,
    ChainBurnCeloErc20,
    ChainDeployCeloErc20,
    ChainMintCeloErc20,
    ChainTransferCeloErc20Token,
  } from './Erc20Base';
import { PathAddressContractAddressChain } from './dto/PathAddressContractAddressChain';
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

    @Post('/v3/blockchain/token/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc20(
      @Body() body: ChainTransferEthErc20 | ChainTransferBscBep20 | ChainTransferCeloErc20Token
    ) {
        try {
            return await this.service.transferErc20(body);
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

    @Post('/v3/blockchain/token/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc20(@Body() body: ChainBurnErc20 | ChainBurnCeloErc20) {
        try {
            return await this.service.burnErc20(body);
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

    @Post('/v3/blockchain/token/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc20(@Body() body: ChainMintErc20 | ChainMintCeloErc20) {
        try {
            return await this.service.mintErc20(body);
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

    @Post('/v3/blockchain/token/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc20(@Body() body: ChainDeployErc20 | ChainDeployCeloErc20 ) {
        try {
            return await this.service.deployErc20(body);
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
