import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Put} from '@nestjs/common';
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
    TransferMultiToken,
    TransferMultiTokenBatch,
    UpdateCashbackMultiToken,
    CeloUpdateCashbackMultiToken
} from '@tatumio/tatum';
import {PathAddressContractAddressChain} from './dto/PathAddressContractAddressChain';
import {PathTokenIdContractAddressChain} from './dto/PathTokenIdContractAddressChain';
import {PathChainTxId} from './dto/PathChainTxId';

export abstract class MultiTokenController {
    protected constructor(protected readonly service: MultiTokenService) {
    }

    @Get('/v3/multitoken/balance/:chain/:contractAddress/:address')
    public async getBalanceMultiToken(@Param() path: PathAddressContractAddressChain) {
        try {
            return await this.service.getTokensOfOwner(path.chain, path.address, path.contractAddress);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Get('/v3/multitoken/transaction/:chain/:txId')
    public async getTransaction(@Param() path: PathChainTxId) {
        try {
            return await this.service.getTransaction(path.chain, path.txId);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Get('/v3/multitoken/metadata/:chain/:contractAddress/:tokenId')
    public async getMetadataMultiToken(@Param() path: PathTokenIdContractAddressChain) {
        try {
            return await this.service.getMetadataMultiToken(path.chain, path.tokenId, path.contractAddress);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Get('/v3/multitoken/royalty/:chain/:contractAddress/:tokenId')
    public async getRoyaltyMultiToken(@Param() path: PathTokenIdContractAddressChain) {
        try {
            return await this.service.getRoyaltyMultiToken(path.chain, path.tokenId, path.contractAddress);
        } catch (e) {
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionMultiToken(@Body() body: CeloTransferMultiToken | TransferMultiToken) {
        try {
            return await this.service.transferMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Post('/v3/multitoken/transaction/batch')
    @HttpCode(HttpStatus.OK)
    public async transactionMultiTokenBatch(@Body() body: CeloTransferMultiTokenBatch | TransferMultiTokenBatch) {
        try {
            return await this.service.transferMultiTokenBatch(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Put('/v3/multitoken/royalty')
    @HttpCode(HttpStatus.OK)
    public async updateRoyaltyMultiToken(@Body() body: CeloUpdateCashbackMultiToken | UpdateCashbackMultiToken) {
        try {
            return await this.service.updateCashbackForAuthor(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/mint/')
    @HttpCode(HttpStatus.OK)
    public async mintMultiToken(@Body() body: CeloMintMultiToken | MintMultiToken) {
        try {
            return await this.service.mintMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Post('/v3/multitoken/mint/batch')
    @HttpCode(HttpStatus.OK)
    public async mintMultiTokenBatch(@Body() body: CeloMintMultiTokenBatch | MintMultiTokenBatch) {
        try {
            return await this.service.mintMultiTokenBatch(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/burn')
    @HttpCode(HttpStatus.OK)
    public async burnMultiToken(@Body() body: CeloBurnMultiToken | EthBurnMultiToken) {
        try {
            return await this.service.burnMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
    @Post('/v3/multitoken/burn/batch')
    @HttpCode(HttpStatus.OK)
    public async burnMultiTokenBatch(@Body() body: CeloBurnMultiTokenBatch | EthBurnMultiTokenBatch) {
        try {
            return await this.service.burnMultiTokenBatch(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }

    @Post('/v3/multitoken/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployMultiToken(@Body() body: CeloDeployMultiToken | EthDeployMultiToken) {
        try {
            return await this.service.deployMultiToken(body);
        } catch (e) {
            if (['Array', 'MultiTokenError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new MultiTokenError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'multitoken.error');
        }
    }
}
