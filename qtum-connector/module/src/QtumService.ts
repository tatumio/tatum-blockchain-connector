import { PinoLogger } from 'nestjs-pino';
import axios from 'axios';
import { QtumError } from './QtumError';
import { QtumIUTXO, QtumIGetInfo, QtumIContractCall, QtumISendRawTxResult, QtumIRawTransactionInfo, QtumIRawTransactions } from './dto/qtumTx'
import { INSIGHT_BASEURLS } from 'src';

export abstract class QtumService {

    protected constructor(protected readonly logger: PinoLogger) {
    }
    public async getQtumUTXOs(testnet: boolean, address: string): Promise<QtumIUTXO[]> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/addr/${address}/utxo`)
            return res.data
        } catch (e) {
            this.logger.error(e);
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async getInfo(testnet: boolean, address: string): Promise<QtumIGetInfo> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/addr/${address}`)
            return res.data
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }

    public async sendRawTx(testnet: boolean, rawtx: string): Promise<QtumISendRawTxResult> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
            const res = await axios.post(baseURL + "/tx/send", {
                rawtx,
            })

            return res.data
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }
    }
    public async contractCall(
        testnet: boolean,
        address: string,
        encodedData: string,
    ): Promise<QtumIContractCall> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
            const res = await axios.get(baseURL +
                `/contracts/${address}/hash/${encodedData}/call`,
            )
            return res.data
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async estimateFee(testnet: boolean, nblocks: number = 6): Promise<any> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
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
    public async estimateFeePerByte(testnet: boolean, nblocks: number = 6): Promise<any> {
        try {
            const feeRate = await this.estimateFee(testnet, nblocks)
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
        testnet: boolean,
        id: string,
    ): Promise<QtumIRawTransactionInfo> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
            const res = await axios.get(baseURL + `/tx/${id}`)
            return res.data as QtumIRawTransactionInfo
        } catch (e) {
            this.logger.error(e)
            throw new QtumError(`Error occurred. ${e}`, 'qtum.error');
        }

    }
    public async getQtumTransactions(
        testnet: boolean,
        address: string,
        pageNum: number = 0,
    ): Promise<QtumIRawTransactions> {
        try {
            const baseURL = testnet ? INSIGHT_BASEURLS['QTUM_TESTNET'] : INSIGHT_BASEURLS['QTUM_MAINNET']
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
