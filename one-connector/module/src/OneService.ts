import {PinoLogger} from 'nestjs-pino';
import {HarmonyAddress} from '@harmony-js/crypto';
import {Harmony} from '@harmony-js/core';
import {ChainID, ChainType, numberToHex} from '@harmony-js/utils';
import {
    Currency,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    OneTransfer,
    prepareOneSignedTransaction,
    prepareOneSmartContractWriteMethodInvocation,
    sendOneSmartContractMethodInvocationTransaction,
    SignatureId,
    SmartContractMethodInvocation,
    SmartContractReadMethodInvocation,
    TransactionHash,
} from '@tatumio/tatum';
import {fromWei} from 'web3-utils';
import axios from 'axios';
import {OneError} from './OneError';
import BigNumber from 'bignumber.js';
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

    private static mapTransaction(t: any) {
        const {r, s, v, ...tx} = t;
        return {
            ...tx,
            blockNumber: parseInt(tx.blockNumber, 16),
            from: tx.from ? new HarmonyAddress(tx.from).basicHex : undefined,
            to: tx.to ? new HarmonyAddress(tx.to).basicHex : undefined,
            contractAddress: tx.contractAddress ? new HarmonyAddress(tx.contractAddress).basicHex : undefined,
            gas: parseInt(tx.gas, 16),
            gasPrice: parseInt(tx.gasPrice, 16),
            timestamp: parseInt(tx.timestamp, 16),
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
            })) || []
        };
    };

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract isTestnet(): Promise<boolean>

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    public async getFirstNodeUrl(testnet: boolean, shardID = 0): Promise<string> {
        const nodes = await this.getNodesUrl(testnet);
        if (nodes.length === 0) {
            new OneError('Nodes url array must have at least one element.', 'one.nodes.url');
        }
        return nodes[0].replace('s0', `s${shardID}`);
    }

    public async getClient(testnet: boolean, shardID = 0): Promise<Harmony> {
        const url = await this.getFirstNodeUrl(testnet, shardID);
        return new Harmony(url, {
            shardID,
            chainType: ChainType.Harmony,
            chainId: testnet ? ChainID.HmyTestnet : ChainID.HmyMainnet,
        });
    }

    public async broadcast(txData: string, signatureId?: string, shardID?: number): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for ONE with data '${txData}'`);
        const client = new Web3(await this.getFirstNodeUrl(await this.isTestnet(), shardID));
        const result: { txId: string } = await new Promise((async (resolve, reject) => {
            client.eth.sendSignedTransaction(txData)
                .once('transactionHash', txId => resolve({txId}))
                .on('error', e => reject(new OneError(`Unable to broadcast transaction due to ${e.message}.`, 'one.broadcast.failed')));
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
        const clients = await Promise.all([0, 1, 2, 3].map(i => this.getClient(t, i)));
        const all = await Promise.all(clients.map((harmony, i) => harmony.blockchain.getBlockNumber(i)));
        return all.map(({result}: { result: string }, shardID: number) => ({
            shardID,
            blockNumber: parseInt(result, 16)
        }));
    }

    public async getBlock(hash: string, shardID?: number, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        const harmony = await this.getClient(t, shardID);
        try {
            const isHash = typeof hash === 'string' && hash.length >= 64;
            const {result: block} = isHash
                ? await harmony.blockchain.getBlockByHash({blockHash: hash})
                : await harmony.blockchain.getBlockByNumber({blockNumber: numberToHex(hash)});
            const txs = [];
            for (const tx of block.transactions || []) {
                txs.push({...tx, ...(await harmony.blockchain.getTransactionReceipt({txnHash: tx.hash})).result});
            }
            block.transactions = txs;
            return OneService.mapBlock(block);
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async getTransaction(txId: string, shardID?: number, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        const harmony = await this.getClient(t, shardID);

        try {
            const {result} = await harmony.blockchain.getTransactionByHash({txnHash: txId});
            const {s, r, v, ...tx} = result;
            let receipt = {};
            try {
                const {result} = await harmony.blockchain.getTransactionReceipt({txnHash: txId});
                receipt = result;
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
                                                 }: BroadcastOrStoreKMSTransaction, shardID?: number) {
        if (signatureId) {
            return {
                signatureId: await this.storeKMSTransaction(transactionData, Currency.ONE, [signatureId], index),
            };
        }
        return this.broadcast(transactionData, undefined, shardID);
    }

    public async web3Method(body: any, shardID?: number) {
        const node = await this.getFirstNodeUrl(await this.isTestnet(), shardID);
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

    public async getBalance(address: string, shardID?: number): Promise<{ balance: string }> {
        const client = await this.getClient(await this.isTestnet(), shardID);
        return {balance: fromWei((await client.blockchain.getBalance({address, shardID})).result, 'ether')};
    }

    public async sendTransaction(transfer: OneTransfer, shardID?: number): Promise<TransactionHash | SignatureId> {
        const testnet = await this.isTestnet();
        const transactionData = await prepareOneSignedTransaction(testnet, transfer, await this.getFirstNodeUrl(testnet, shardID));
        return this.broadcastOrStoreKMSTransaction({
            transactionData, signatureId: transfer.signatureId,
            index: transfer.index
        }, shardID);
    }

    public async getTransactionCount(address: string, shardID?: number) {
        const client = await this.getClient(await this.isTestnet(), shardID);
        return parseInt((await client.blockchain.getTransactionCount({address, blockNumber: 'pending'})).result, 16);
    }

    public async invokeSmartContractMethod(smartContractMethodInvocation: SmartContractMethodInvocation | SmartContractReadMethodInvocation, shardID?: number) {
        const testnet = await this.isTestnet();
        const node = await this.getFirstNodeUrl(testnet, shardID);
        if (smartContractMethodInvocation.methodABI.stateMutability === 'view') {
            return sendOneSmartContractMethodInvocationTransaction(testnet, smartContractMethodInvocation, node);
        }

        const transactionData = await prepareOneSmartContractWriteMethodInvocation(testnet, smartContractMethodInvocation, node);
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: (smartContractMethodInvocation as SmartContractMethodInvocation).signatureId,
            index: (smartContractMethodInvocation as SmartContractMethodInvocation).index
        }, shardID);
    }

    public formatAddress(address: string) {
        return {address: new HarmonyAddress(address).bech32};
    }
}
