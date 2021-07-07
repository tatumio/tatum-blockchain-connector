import { Body, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { QtumService } from './QtumService';
import { QtumError } from './QtumError';
import { QtumEndpointGuard } from './QtumEndpointGuard';
import { RawTx, contractCall, QtumIRawTransactionInfo, QtumIRawTransactions } from './dto/qtumTx';

@UseGuards(QtumEndpointGuard)
export abstract class QtumController {
    protected constructor(protected readonly service: QtumService) {
    }
    @Post('v3/qtum/contractCall')
    async contractCall(@Body() body: contractCall) {
        try {
            return await this.service.contractCall(body.testnet, body.address, body.encodedData);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Post('v3/qtum/sendRawTx')
    async sendRawTx(@Body() body: RawTx) {
        try {
            return await this.service.sendRawTx(body.testnet, body.rawtx);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/:chain/utxos/:address')
    async getQtumUTXOs(@Param() path: { chain: string, address: string }) {
        try {
            return await this.service.getQtumUTXOs(path.chain == 'testnet' ? true : false, path.address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/:chain/:address/info')
    async getInfo(@Param() path: { address: string, chain: string }) {
        try {
            return await this.service.getInfo(path.chain == 'testnet' ? true : false, path.address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/:chain/transaction/:id')
    async getQtumTransaction(@Param() path: { id: string, chain: string }): Promise<QtumIRawTransactionInfo> {
        try {
            return await this.service.getQtumTransaction(path.chain == 'testnet' ? true : false, path.id);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/:chain/transactions/:id/:pageNum')
    async getQtumTransactions(@Param() path: { chain: string, id: string, pageNum: number }): Promise<QtumIRawTransactions> {
        try {
            return await this.service.getQtumTransactions(path.chain == 'testnet' ? true : false, path.id, path.pageNum);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/:chain/transactions/:nblocks/estimate')
    async estimateFee(@Param() path: { chain: string, nblocks: number }): Promise<any> {
        try {
            return await this.service.estimateFee(path.chain == 'testnet' ? true : false, path.nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }
    @Get('/v3/qtum/:chain/transactions/:nblocks/estimateperbyte')
    async estimateFeePerByte(@Param() path: { chain: string, nblocks: number }): Promise<any> {
        try {
            return await this.service.estimateFeePerByte(path.chain == 'testnet' ? true : false, path.nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

}
