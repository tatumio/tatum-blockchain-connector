import {PinoLogger} from 'nestjs-pino';
import {HarmonyAddress} from '@harmony-js/crypto';
import {Harmony} from '@harmony-js/core';
import {
    Currency,
    EstimateGasEth,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    OneTransfer,
    prepareOneSignedTransaction,
    prepareOneSmartContractWriteMethodInvocation,
    sendOneSmartContractMethodInvocationTransaction,
    SignatureId,
    SmartContractMethodInvocation,
    TransactionHash,
} from '@tatumio/tatum';
import {fromWei} from 'web3-utils';
import axios from 'axios';
import {OneError} from './OneError';
import BigNumber from 'bignumber.js';
import {ChainID, ChainType} from '@harmony-js/utils';
import Web3 from 'web3';

export abstract class OneService {

    private static mapBlock(block: any) {
        return {
            ...block,
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
            transactions: block.transactions.map(OneService.mapTransaction),
            uncles: block.uncles,
        };
    }

    private static mapTransaction(tx: any) {
        return {
            ...tx,
            blockNumber: parseInt(tx.blockNumber, 16),
            gas: parseInt(tx.gas, 16),
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

    private async getFirstNodeUrl(testnet: boolean): Promise<string> {
        const nodes = await this.getNodesUrl(testnet);
        if (nodes.length === 0) {
            new OneError('Nodes url array must have at least one element.', 'bsc.nodes.url');
        }
        return nodes[0];
    }

    public async getClient(testnet: boolean): Promise<Harmony> {
        return new Harmony(await this.getFirstNodeUrl(testnet), {
            shardID: 0,
            chainType: ChainType.Harmony,
            chainId: testnet ? ChainID.HmyTestnet : ChainID.HmyMainnet,
        });
    }

    public async broadcast(txData: string, signatureId?: string): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for ONE with data '${txData}'`);
        const client = new Web3(await this.getFirstNodeUrl(await this.isTestnet()));
        const result: { txId: string } = await new Promise((async (resolve, reject) => {
            client.eth.sendSignedTransaction(txData)
                .once('transactionHash', txId => resolve({txId}))
                .on('error', e => reject(new OneError(`Unable to broadcast transaction due to ${e.message}.`, 'bsc.broadcast.failed')));
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

    public async getCurrentBlock(testnet?: boolean): Promise<{ shardID: number, blockNumber: number }[]> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        const harmony = await this.getClient(t);
        const all = await Promise.all([harmony.blockchain.getBlockNumber(0),
            harmony.blockchain.getBlockNumber(1),
            harmony.blockchain.getBlockNumber(2),
            harmony.blockchain.getBlockNumber(3)]);
        return all.map((blockNumber: number, shardID: number) => ({shardID, blockNumber}));
    }

    public async getBlock(hash: string, shardID?: number, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        const harmony = await this.getClient(t);
        try {
            const isHash = typeof hash === 'string' && hash.length >= 64;
            const block = isHash
                ? await harmony.blockchain.getBlockByHash({blockHash: hash, shardID})
                : await harmony.blockchain.getBlockByNumber({blockNumber: hash, shardID})
            return OneService.mapBlock(block);
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async getTransaction(txId: string, shardID?: number, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        const harmony = await this.getClient(t);

        try {
            const tx = await harmony.blockchain.getTransactionByHash({txnHash: txId, shardID});
            let receipt = {};
            try {
                receipt = await harmony.blockchain.getTransactionReceipt({txnHash: txId, shardID});
            } catch (_) {
                tx.transactionHash = txId;
            }
            return OneService.mapTransaction({...tx, ...receipt});
        } catch (e) {
            this.logger.error(e);
            throw new OneError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    private async broadcastOrStoreKMSTransaction({
                                                     transactionData,
                                                     signatureId,
                                                     index
                                                 }: BroadcastOrStoreKMSTransaction) {
        if (signatureId) {
            return {
                signatureId: await this.storeKMSTransaction(transactionData, Currency.ONE, [signatureId], index),
            };
        }
        return this.broadcast(transactionData);
    }

    public async web3Method(body: any) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        return (await axios.post(node, body, {headers: {'Content-Type': 'application/json'}})).data;
    }

    public async generateWallet(mnemonic?: string) {
        return generateWallet(Currency.ONE, await this.isTestnet(), mnemonic);
    }

    public async generatePrivateKey(mnemonic: string, index: number) {
        const key = await generatePrivateKeyFromMnemonic(Currency.ONE, await this.isTestnet(), mnemonic, index);
        return {key};
    }

    public async generateAddress(xpub: string, derivationIndex: string): Promise<{ address: string }> {
        const address = await generateAddressFromXPub(Currency.ONE, await this.isTestnet(), xpub, parseInt(derivationIndex));
        return {address};
    }

    public async estimateGas(body: EstimateGasEth) {
        const client = await this.getClient(await this.isTestnet());
        return {
            gasLimit: await client.blockchain.estimateGas({data: '0x', ...body}),
            gasPrice: fromWei(await client.blockchain.gasPrice(), 'gwei'),
        };
    }

    public async getBalance(address: string, shardID?: number): Promise<{ balance: string }> {
        const client = await this.getClient(await this.isTestnet());
        return {balance: fromWei(await client.blockchain.getBalance({address, shardID}), 'ether')};
    }

    public async sendTransaction(transfer: OneTransfer): Promise<TransactionHash | SignatureId> {
        const testnet = await this.isTestnet();
        const transactionData = await prepareOneSignedTransaction(testnet, transfer, await this.getFirstNodeUrl(testnet));
        return this.broadcastOrStoreKMSTransaction({
            transactionData, signatureId: transfer.signatureId,
            index: transfer.index
        });
    }

    public async getTransactionCount(address: string, shardID?: number) {
        const client = await this.getClient(await this.isTestnet());
        return client.blockchain.getTransactionCount({address, shardID, blockNumber: 'pending'});
    }

    public async invokeSmartContractMethod(smartContractMethodInvocation: SmartContractMethodInvocation) {
        const testnet = await this.isTestnet();
        const node = await this.getFirstNodeUrl(testnet);
        if (smartContractMethodInvocation.methodABI.stateMutability === 'view') {
            return sendOneSmartContractMethodInvocationTransaction(testnet, smartContractMethodInvocation, node);
        }

        const transactionData = await prepareOneSmartContractWriteMethodInvocation(testnet, smartContractMethodInvocation, node);
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: smartContractMethodInvocation.signatureId,
            index: smartContractMethodInvocation.index
        });
    }

    public async formatAddress(address: string) {
        return new HarmonyAddress(address).bech32;
    }
}
