import { PinoLogger } from 'nestjs-pino';
import axios from 'axios';
import { QtumError } from './QtumError';
import { QTUM_URLS } from 'src';
import { QtumIUTXO, QtumIGetInfo, QtumISendRawTxResult, QtumIRawTransactionInfo, QtumIRawTransactions } from '@tatumio/tatum';
import { QtumBlock } from '@tatumio/tatum/dist/src/model/response/qtum/QtumBlock';
export abstract class QtumService {

    protected constructor(protected readonly logger: PinoLogger) {
    }
    protected abstract isTestnet(): Promise<boolean>

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    private async getFirstNodeUrl(): Promise<string> {
        const nodes = await this.getNodesUrl(await this.isTestnet())
        if (nodes.length === 0) {
            new QtumError('Nodes url array must have at least one element.', 'qtum.nodes.url')
        }
        return nodes[0]
    }
    public async getQtumUTXOs(address: string): Promise<QtumIUTXO[]> {
        try {
            const network = await this.isTestnet()
            const baseURL = network ? QTUM_URLS['QTUM_TESTNET'] : QTUM_URLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/addr/${address}/utxo`)
            return res.data
        } catch (e) {
            this.logger.error(e);
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async getInfo(address: string): Promise<QtumIGetInfo> {
        try {
            const network = await this.isTestnet()
            const baseURL = network ? QTUM_URLS['QTUM_TESTNET'] : QTUM_URLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/addr/${address}`)
            return res.data
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }
    public async getCurrentBlock(): Promise<any> {
        try {
            const baseurl = await this.getFirstNodeUrl()
            const data = () => ({ "jsonrpc": "1.0", "method": "getbestblockhash", "params": [] })
            const config = { headers: { 'content-type': 'text/plain;' } }
            const res = await axios.post(baseurl, data(), config)
            return res['result']
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }
    public async getBlock(hash: string): Promise<QtumBlock> {
        try {
            const baseurl = await this.getFirstNodeUrl()
            const data = () => ({ "jsonrpc": "1.0", "method": "getblock", "params": [hash] })
            const config = { headers: { 'content-type': 'text/plain;' } }
            const res = await axios.post(baseurl, data(), config)
            return res.data.result
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }

    public async broadcast(rawtx: string): Promise<QtumISendRawTxResult> {
        try {
            const network = await this.isTestnet()
            const baseURL = network ? QTUM_URLS['QTUM_TESTNET'] : QTUM_URLS['QTUM_MAINNET']
            const res = await axios.post(baseURL + "/tx/send", {
                rawtx,
            })

            return res.data
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }
    public async estimateFee(nblocks: number = 6): Promise<any> {
        try {
            const network = await this.isTestnet()
            const baseURL = network ? QTUM_URLS['QTUM_TESTNET'] : QTUM_URLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/utils/estimatefee?nbBlocks=${nblocks}`)

            const feeRate: number = res.data
            if (typeof feeRate !== "number" || feeRate < 0) {
                return -1
            }
            return Math.ceil(feeRate * 1e8)
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async estimateFeePerByte(nblocks: number = 6): Promise<any> {
        try {
            const feeRate = await this.estimateFee(nblocks)
            if (feeRate < 0) {
                return feeRate
            }
            return Math.ceil(feeRate / 1024)
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async getQtumTransaction(
        id: string,
    ): Promise<QtumIRawTransactionInfo> {
        try {
            const network = await this.isTestnet()
            const baseURL = network ? QTUM_URLS['QTUM_TESTNET'] : QTUM_URLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/tx/${id}`)
            return res.data as QtumIRawTransactionInfo
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async getQtumTransactions(
        address: string,
        pageNum: number = 0,
    ): Promise<QtumIRawTransactions> {
        try {
            const network = await this.isTestnet()
            const baseURL = network ? QTUM_URLS['QTUM_TESTNET'] : QTUM_URLS['QTUM_MAINNET']
            const result = await axios.get(baseURL + `/txs/`, {
                params: { address, pageNum },
            })
            return result.data as QtumIRawTransactions
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }
}
