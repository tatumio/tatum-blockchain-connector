import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Put, Query} from '@nestjs/common';
import {NftService} from './NftService';
import {NftError} from './NftError';
import {
    CeloBurnErc721,
    CeloDeployErc721,
    CeloMintErc721,
    CeloMintMultipleErc721,
    CeloTransferErc721,
    EthBurnErc721,
    EthDeployErc721,
    EthMintErc721,
    EthMintMultipleErc721,
    FlowBurnNft,
    FlowDeployNft,
    FlowMintMultipleNft,
    FlowMintNft,
    FlowTransferNft,
    EthTransferErc721,
    UpdateCashbackErc721,
    TronUpdateCashbackTrc721,
    CeloUpdateCashbackErc721,
    TronDeployTrc721,
    TronBurnTrc721,
    TronMintMultipleTrc721,
    TronTransferTrc721,
    OneDeploy721, OneBurn721, OneMintMultiple721, OneUpdateCashback721, TronMintTrc721, OneMint721, OneTransfer721,
} from '@tatumio/tatum';
import {PathAddressContractAddressChain} from './dto/PathAddressContractAddressChain';
import {PathTokenIdContractAddressChain} from './dto/PathTokenIdContractAddressChain';
import {PathChainTxId} from './dto/PathChainTxId';

export abstract class NftController {
    protected constructor(protected readonly service: NftService) {
    }

    @Get('/v3/nft/balance/:chain/:contractAddress/:address')
    public async getBalanceErc721(@Param() path: PathAddressContractAddressChain) {
        try {
            return await this.service.getTokensOfOwner(path.chain, path.address, path.contractAddress);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/v3/nft/transaction/:chain/:txId')
    public async getTransaction(@Param() path: PathChainTxId) {
        try {
            return await this.service.getTransaction(path.chain, path.txId);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/v3/nft/address/:chain/:txId')
    public async getContractAddress(@Param() path: PathChainTxId) {
        try {
            return await this.service.getContractAddress(path.chain, path.txId);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/v3/nft/metadata/:chain/:contractAddress/:tokenId')
    public async getMetadataErc721(@Param() path: PathTokenIdContractAddressChain, @Query('account') account: string) {
        try {
            return await this.service.getMetadataErc721(path.chain, path.tokenId, path.contractAddress, account);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/v3/nft/royalty/:chain/:contractAddress/:tokenId')
    public async getRoyaltyErc721(@Param() path: PathTokenIdContractAddressChain) {
        try {
            return await this.service.getRoyaltyErc721(path.chain, path.tokenId, path.contractAddress);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/v3/nft/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc721(@Body() body: CeloTransferErc721 | EthTransferErc721 | FlowTransferNft | TronTransferTrc721 | OneTransfer721) {
        try {
            return await this.service.transferErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/v3/nft/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc721(@Body() body: CeloMintErc721 | EthMintErc721 | FlowMintNft | TronMintTrc721 | OneMint721) {
        try {
            return await this.service.mintErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Put('/v3/nft/royalty')
    @HttpCode(HttpStatus.OK)
    public async updateRoyaltyErc721(@Body() body: CeloUpdateCashbackErc721 | TronUpdateCashbackTrc721 | UpdateCashbackErc721 | OneUpdateCashback721) {
        try {
            return await this.service.updateCashbackForAuthor(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/v3/nft/mint/batch')
    @HttpCode(HttpStatus.OK)
    public async mintMultipleErc721(@Body() body: CeloMintMultipleErc721 | TronMintMultipleTrc721 | EthMintMultipleErc721 | FlowMintMultipleNft | OneMintMultiple721) {
        try {
            return await this.service.mintMultipleErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/v3/nft/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc721(@Body() body: CeloBurnErc721 | TronBurnTrc721 | EthBurnErc721 | FlowBurnNft | OneBurn721) {
        try {
            return await this.service.burnErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/v3/nft/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc721(@Body() body: CeloDeployErc721 | TronDeployTrc721 | EthDeployErc721 | FlowDeployNft | OneDeploy721) {
        try {
            return await this.service.deployErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }
}
