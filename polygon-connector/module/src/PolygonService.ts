import {PinoLogger} from 'nestjs-pino';
import {
    Currency,
    EstimateGasEth,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    polygonGetGasPriceInWei,
    preparePolygonSignedTransaction,
    preparePolygonSmartContractWriteMethodInvocation,
    sendPolygonSmartContractReadMethodInvocationTransaction,
    SignatureId,
    SmartContractMethodInvocation,
    SmartContractReadMethodInvocation,
    TransactionHash,
    TransferEthErc20,
} from '@tatumio/tatum';
import {BroadcastOrStoreKMSTransaction} from '@tatumio/blockchain-connector-common';
import Web3 from 'web3';
import {fromWei} from 'web3-utils';
import axios from 'axios';
import {PolygonError} from './PolygonError';
import BigNumber from 'bignumber.js';

export abstract class PolygonService {

    private static mapBlock(block: any) {
        return {
            difficulty: parseInt(block.difficulty, 16),
            extraData: block.extraData,
            gasLimit: parseInt(block.gasLimit, 16),
            gasUsed: parseInt(block.gasUsed, 16),
            hash: block.hash,
            logsBloom: block.logsBloom,
            miner: block.miner,
            nonce: block.nonce,
            number: parseInt(block.number, 16),
            parentHash: block.parentHash,
            sha3Uncles: block.sha3Uncles,
            size: parseInt(block.size, 16),
            stateRoot: block.stateRoot,
            timestamp: parseInt(block.timestamp, 16),
            totalDifficulty: parseInt(block.totalDifficulty, 16),
            transactions: block.transactions.map(PolygonService.mapTransaction),
            uncles: block.uncles,
        };
    }

    private static mapTransaction(tx: any) {
        delete tx.r;
        delete tx.s;
        delete tx.v;
        return {
            ...tx,
            blockNumber: parseInt(tx.blockNumber, 16),
            gas: parseInt(tx.gas, 16),
            gasPrice: parseInt(tx.gasPrice, 16),
            nonce: parseInt(tx.nonce, 16),
            transactionIndex: parseInt(tx.transactionIndex, 16),
            value: new BigNumber(tx.value).toString(),
            gasUsed: tx.gasUsed !== undefined ? new BigNumber(tx.gasUsed).toString() : undefined,
            cumulativeGasUsed: tx.cumulativeGasUsed !== undefined ? new BigNumber(tx.cumulativeGasUsed).toString() : undefined,
            transactionHash: tx.hash,
            status: tx.status !== undefined ? !!parseInt(tx.status, 16) : undefined,
            logs: tx.logs?.map(l => ({
                ...l,
                logIndex: parseInt(l.logIndex, 16),
                transactionIndex: parseInt(l.transactionIndex, 16),
                blockNumber: parseInt(l.blockNumber, 16),
            }))
        };
    };

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract isTestnet(): Promise<boolean>

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    public async getFirstNodeUrl(testnet: boolean): Promise<string> {
        const nodes = await this.getNodesUrl(testnet);
        if (nodes.length === 0) {
            new PolygonError('Nodes url array must have at least one element.', 'bsc.nodes.url');
        }
        return nodes[0];
    }

    public async getClient(testnet: boolean): Promise<Web3> {
        return new Web3(await this.getFirstNodeUrl(testnet));
    }

    public async broadcast(txData: string, signatureId?: string): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for MATIC with data '${txData}'`);
        const client = await this.getClient(await this.isTestnet());
        const result: { txId: string } = await new Promise((async (resolve, reject) => {
            client.eth.sendSignedTransaction(txData)
                .once('transactionHash', txId => resolve({txId}))
                .on('error', e => reject(new PolygonError(`Unable to broadcast transaction due to ${e.message}.`, 'bsc.broadcast.failed')));
        }));

        if (signatureId) {
            try {
                await this.completeKMSTransaction(result.txId, signatureId);
            } catch (e) {
                this.logger.error(e);
                return {txId: result.txId, failed: true};
            }
        }

        return result;
    }

    public async getCurrentBlock(testnet?: boolean): Promise<number> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        return (await this.getClient(t)).eth.getBlockNumber();
    }

    public async getBlock(hash: string | number, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const isHash = typeof hash === 'string' && hash.length >= 64;
            const block = (await axios.post(await this.getFirstNodeUrl(t), {
                jsonrpc: '2.0',
                id: 0,
                method: isHash ? 'eth_getBlockByHash' : 'eth_getBlockByNumber',
                params: [
                    isHash ? hash : `0x${new BigNumber(hash).toString(16)}`,
                    true
                ]
            }, {headers: {'Content-Type': 'application/json'}})).data.result;
            return PolygonService.mapBlock(block);
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async getTransaction(txId: string, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const {r, s, v, hash, ...transaction} = (await axios.post(await this.getFirstNodeUrl(t), {
                jsonrpc: '2.0',
                id: 0,
                method: 'eth_getTransactionByHash',
                params: [
                    txId
                ]
            }, {headers: {'Content-Type': 'application/json'}})).data?.result;
            let receipt = {};
            try {
                receipt = (await axios.post(await this.getFirstNodeUrl(t), {
                    jsonrpc: '2.0',
                    id: 0,
                    method: 'eth_getTransactionReceipt',
                    params: [
                        txId
                    ]
                }, {headers: {'Content-Type': 'application/json'}})).data?.result;
            } catch (_) {
                transaction.transactionHash = hash;
            }
            return PolygonService.mapTransaction({...transaction, ...receipt, hash});
        } catch (e) {
            this.logger.error(e);
            throw new PolygonError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    private async broadcastOrStoreKMSTransaction({
                                                     transactionData,
                                                     signatureId,
                                                     index
                                                 }: BroadcastOrStoreKMSTransaction) {
        if (signatureId) {
            return {
                signatureId: await this.storeKMSTransaction(transactionData, Currency.MATIC, [signatureId], index),
            };
        }
        return this.broadcast(transactionData);
    }

    public async web3Method(body: any) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        return (await axios.post(node, body, {headers: {'Content-Type': 'application/json'}})).data;
    }

    public async generateWallet(mnemonic?: string) {
        return generateWallet(Currency.MATIC, await this.isTestnet(), mnemonic);
    }

    public async generatePrivateKey(mnemonic: string, index: number) {
        const key = await generatePrivateKeyFromMnemonic(Currency.MATIC, await this.isTestnet(), mnemonic, index);
        return {key};
    }

    public async generateAddress(xpub: string, derivationIndex: string): Promise<{ address: string }> {
        const address = await generateAddressFromXPub(Currency.MATIC, await this.isTestnet(), xpub, parseInt(derivationIndex));
        return {address};
    }

    public async estimateGas(body: EstimateGasEth) {
        const client = await this.getClient(await this.isTestnet());
        return {
            gasLimit: await client.eth.estimateGas(body),
            gasPrice: await polygonGetGasPriceInWei(),
        };
    }

    public async getBalance(address: string): Promise<{ balance: string }> {
        const client = await this.getClient(await this.isTestnet());
        return {balance: fromWei(await client.eth.getBalance(address), 'ether')};
    }

    public async sendMatic(transfer: TransferEthErc20): Promise<TransactionHash | SignatureId> {
        const transactionData = await preparePolygonSignedTransaction(await this.isTestnet(), transfer, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData, signatureId: transfer.signatureId,
            index: transfer.index
        });
    }

    public async getTransactionCount(address: string) {
        const client = await this.getClient(await this.isTestnet());
        return client.eth.getTransactionCount(address, 'pending');
    }

    public async invokeSmartContractMethod(smartContractMethodInvocation: SmartContractMethodInvocation | SmartContractReadMethodInvocation) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        if (smartContractMethodInvocation.methodABI.stateMutability === 'view') {
            return sendPolygonSmartContractReadMethodInvocationTransaction(await this.isTestnet(), smartContractMethodInvocation, node);
        }

        const transactionData = await preparePolygonSmartContractWriteMethodInvocation(await this.isTestnet(), smartContractMethodInvocation, node);
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: (smartContractMethodInvocation as SmartContractMethodInvocation).signatureId,
            index: (smartContractMethodInvocation as SmartContractMethodInvocation).index
        });
    }
}
