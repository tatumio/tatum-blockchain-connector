import { BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import {MultiTokenService} from './MultiTokenService';
import {MultiTokenError} from './MultiTokenError';
import {
    CeloBurnMultiToken,
    CeloBurnMultiTokenBatch,
    CeloDeployMultiToken,
    CeloMintMultiToken,
    CeloMintMultiTokenBatch,
    CeloTransferMultiToken,
    CeloTransferMultiTokenBatch,
    EthBurnMultiToken,
    EthBurnMultiTokenBatch,
    EthDeployMultiToken,
    MintMultiToken,
    MintMultiTokenBatch,
    OneBurnMultiToken, OneBurnMultiTokenBatch, OneDeployMultiToken,
    OneMintMultiToken,
    OneMintMultiTokenBatch,
    OneTransferMultiToken,
    OneTransferMultiTokenBatch,
    TransferMultiToken,
    TransferMultiTokenBatch,
} from '@tatumio/tatum';
import {PathAddressContractAddressChain} from './dto/PathAddressContractAddressChain';
import {PathTokenIdContractAddressChain} from './dto/PathTokenIdContractAddressChain';
import {PathChainTxId} from './dto/PathChainTxId';
import { PathAddressContractBatch } from './dto/PathAddressContractBatch';

export abstract class MultiTokenController {
    protected constructor(protected readonly service: MultiTokenService) {
    }
    @Get('/v3/multitoken/address/:chain/:txId')
    public async getContractAddress(@Param() path: PathChainTxId) {
        try {
            return await this.service.getContractAddress(path.chain, path.txId);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Get('/v3/multitoken/balance/:chain/:contractAddress/:address/:tokenId')
    public async getBalanceMultiToken(@Param() path: PathAddressContractAddressChain) {
        try {
            return await this.service.getTokensOfOwner(path.chain, path.address, path.tokenId, path.contractAddress);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Get('/v3/multitoken/balance/batch/:chain/:contractAddress')
    public async getBalanceMultiTokenBatch(@Param() path: PathAddressContractBatch, @Query() filter: any) {
        try {
            const addresses = filter.address.split(',')
            const tokenIds = filter.tokenId.split(',')
            return await this.service.getTokensOfOwnerBatch(path.chain, addresses, tokenIds, path.contractAddress);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Get('/v3/multitoken/transaction/:chain/:txId')
    public async getTransaction(@Param() path: PathChainTxId) {
        try {
            return await this.service.getTransaction(path.chain, path.txId);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Get('/v3/multitoken/metadata/:chain/:contractAddress/:tokenId')
    public async getMetadataMultiToken(@Param() path: PathTokenIdContractAddressChain) {
        try {
            return await this.service.getMetadataMultiToken(path.chain, path.tokenId, path.contractAddress);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionMultiToken(@Body() body: CeloTransferMultiToken | TransferMultiToken | OneTransferMultiToken) {
        try {
            return await this.service.transferMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Post('/v3/multitoken/transaction/batch')
    @HttpCode(HttpStatus.OK)
    public async transactionMultiTokenBatch(@Body() body: CeloTransferMultiTokenBatch | TransferMultiTokenBatch | OneTransferMultiTokenBatch) {
        try {
            return await this.service.transferMultiTokenBatch(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/mint/')
    @HttpCode(HttpStatus.OK)
    public async mintMultiToken(@Body() body: CeloMintMultiToken | MintMultiToken | OneMintMultiToken) {
        try {
            return await this.service.mintMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Post('/v3/multitoken/mint/batch')
    @HttpCode(HttpStatus.OK)
    public async mintMultiTokenBatch(@Body() body: CeloMintMultiTokenBatch | MintMultiTokenBatch | OneMintMultiTokenBatch) {
        try {
            return await this.service.mintMultiTokenBatch(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/burn')
    @HttpCode(HttpStatus.OK)
    public async burnMultiToken(@Body() body: CeloBurnMultiToken | EthBurnMultiToken | OneBurnMultiToken) {
        try {
            return await this.service.burnMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Post('/v3/multitoken/burn/batch')
    @HttpCode(HttpStatus.OK)
    public async burnMultiTokenBatch(@Body() body: CeloBurnMultiTokenBatch | EthBurnMultiTokenBatch | OneBurnMultiTokenBatch) {
        try {
            return await this.service.burnMultiTokenBatch(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployMultiToken(@Body() body: CeloDeployMultiToken | EthDeployMultiToken | OneDeployMultiToken) {
        try {
            return await this.service.deployMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message?.message || e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
}
