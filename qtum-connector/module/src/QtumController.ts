import { Body, Get, Param, Post } from '@nestjs/common';
import { QtumService } from './QtumService';
import { QtumError } from './QtumError';
import { QtumIRawTransactionInfo, QtumIRawTransactions } from '@tatumio/tatum/dist/src/model/response';
import {generateAddressFromPrivatekey, generateAddressFromXPub, generatePrivateKeyFromMnemonic} from '@tatumio/tatum/dist/src/wallet/address';
import { Currency } from '@tatumio/tatum';
export abstract class QtumController {
    protected constructor(protected readonly service: QtumService) {
    }
    @Post('v3/qtum/wallet/priv')
    async generatePrivateKey(@Body() body: {menmonic:string,i:number}) {
        try {
            return await generatePrivateKeyFromMnemonic(Currency.QTUM, true, body.menmonic,body.i);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('v3/qtum/address/:xpub/:i')
    async generateAddress(@Param() path:{ xpub:string, i:number }) {
        try {
            return await generateAddressFromXPub(Currency.QTUM, true, path.xpub,path.i);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('v3/qtum/block/current')
    async getCurrentBlock() {
        try {
            return await this.service.getCurrentBlock();
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('v3/qtum/block/:hash')
    async getBlock(@Param() hash:string) {
        try {
            return await this.service.getBlock(hash);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('v3/qtum/address/:key')
    async generateAddressPrivatekey(@Param() key:string) {
        try {
            return await generateAddressFromPrivatekey(Currency.QTUM, true, key);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Post('v3/qtum/broadcast')
    async broadcast(@Body() body: {rawtx:string}) {
        try {
            return await this.service.broadcast(body.rawtx);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/utxo/:address')
    async getQtumUTXOs(@Param() address: string ) {
        try {
            return await this.service.getQtumUTXOs(address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/:address/balance')
    async getInfo(@Param() address: string) {
        try {
            return await this.service.getInfo(address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/transaction/:id')
    async getQtumTransaction(@Param() id: string): Promise<QtumIRawTransactionInfo> {
        try {
            return await this.service.getQtumTransaction(id);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/transactions/address/:address/:pageNum')
    async getQtumTransactions(@Param() path: { address: string, pageNum: number }): Promise<QtumIRawTransactions> {
        try {
            return await this.service.getQtumTransactions(path.address, path.pageNum);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/transactions/gas/:nblocks')
    async estimateFee(@Param() nblocks: number): Promise<any> {
        try {
            return await this.service.estimateFee(nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/transactions/gasbytes/:nblocks')
    async estimateFeePerByte(@Param() nblocks: number): Promise<any> {
        try {
            return await this.service.estimateFeePerByte(nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

}
