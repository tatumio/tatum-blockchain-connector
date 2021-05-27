import {PinoLogger} from 'nestjs-pino';
import {
    xdcGetGasPriceInWei,
    CONTRACT_ADDRESSES,
    Currency,
    DeployErc20,
    EstimateGasEth,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    prepareXdcOrErc20SignedTransaction,
    prepareXdcSmartContractWriteMethodInvocation,
    prepareXdcCustomErc20SignedTransaction,
    prepareXdcDeployErc20SignedTransaction,
    sendXdcSmartContractReadMethodInvocationTransaction,
    SmartContractMethodInvocation,
    TransactionHash,
    TransferEthErc20,
    TransferCustomErc20,
} from '@tatumio/tatum';
import Web3 from 'web3';
import {fromWei} from 'web3-utils';
import ERC20_TOKEN_ABI from '@tatumio/tatum/dist/src/contracts/erc20/token_abi';
import axios from 'axios';
import {SignatureId} from '@tatumio/tatum/dist/src/model/response/common/SignatureId';
import {XdcError} from './XdcError';
import BigNumber from 'bignumber.js';

export abstract class XdcService {

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
            transactions: block.transactions.map(XdcService.mapTransaction),
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
            new XdcError('Nodes url array must have at least one element.', 'xdc.nodes.url');
        }
        return nodes[0];
    }

    public async getClient(testnet: boolean): Promise<Web3> {
        return new Web3(await this.getFirstNodeUrl(testnet));
    }

    public async broadcast(txData: string, signatureId?: string, withdrawalId?: string): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for XDC with data '${txData}'`);
        const client = await this.getClient(await this.isTestnet());
        const result: { txId: string } = await new Promise((async (resolve, reject) => {
            client.eth.sendSignedTransaction(txData)
                .once('transactionHash', txId => resolve({txId}))
                .on('error', e => reject(new XdcError(`Unable to broadcast transaction due to ${e.message}.`, 'xdc.broadcast.failed')));
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
            return XdcService.mapBlock(block);
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
            return XdcService.mapTransaction({...transaction, ...receipt, hash});
        } catch (e) {
            this.logger.error(e);
            throw new XdcError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    private async broadcastOrStoreKMSTransaction({
                                                     transactionData,
                                                     signatureId,
                                                     index
                                                 }: BroadcastOrStoreKMSTransaction) {
        if (signatureId) {
            return {
                signatureId: await this.storeKMSTransaction(transactionData, Currency.XDC, [signatureId], index),
            };
        }
        return this.broadcast(transactionData);
    }

    private fromXdcAddress (xdcAddress) {
      return xdcAddress.replace('xdc', '0x')
    }

    public async web3Method(body: any) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        return (await axios.post(node, body, {headers: {'Content-Type': 'application/json'}})).data;
    }

    public async generateWallet(mnemonic?: string) {
        return generateWallet(Currency.XDC, await this.isTestnet(), mnemonic);
    }

    public async generatePrivateKey(mnemonic: string, index: number) {
        const key = await generatePrivateKeyFromMnemonic(Currency.XDC, await this.isTestnet(), mnemonic, index);
        return {key};
    }

    public async generateAddress(xpub: string, derivationIndex: string): Promise<{ address: string }> {
        const address = await generateAddressFromXPub(Currency.XDC, await this.isTestnet(), xpub, parseInt(derivationIndex));
        return {address};
    }

    public async estimateGas(body: EstimateGasEth): Promise<any> {
        const client = await this.getClient(await this.isTestnet());
        return {
            gasLimit: await client.eth.estimateGas(body),
            gasPrice: await xdcGetGasPriceInWei(),
        };
    }

    public async getBalance(address: string): Promise<{ balance: string }> {
        const client = await this.getClient(await this.isTestnet());
        return {balance: fromWei(await client.eth.getBalance(this.fromXdcAddress(address)), 'ether')};
    }

    public async getErc20Balance(address: string, currency?: string, contractAddress?: string): Promise<{ balance: string }> {
        const testnet = await this.isTestnet();
        const client = await this.getClient(testnet);
        if (testnet && currency) {
            throw new XdcError('Unsupported ERC20 currency for testnet, only mainet supports currency parameter. Please use contractAddress instead.', 'erc20.not.supported');
        }
        const _contract = currency === Currency.XDC ? CONTRACT_ADDRESSES[currency] : this.fromXdcAddress(contractAddress as string);

        // @ts-ignore
        const contract = new client.eth.Contract(ERC20_TOKEN_ABI, _contract);
        return {balance: await contract.methods.balanceOf(address).call()};
    }

    public async sendXdcOrErc20Transaction(transfer: TransferEthErc20): Promise<TransactionHash | SignatureId> {
        const tx = {
          ...transfer,
          to: this.fromXdcAddress(transfer.to)
        } as TransferEthErc20;

        const transactionData = await prepareXdcOrErc20SignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData, 
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async sendCustomErc20Transaction(transferCustomErc20: TransferCustomErc20): Promise<TransactionHash | SignatureId> {
      const tx = {
        ...transferCustomErc20,
        to: this.fromXdcAddress(transferCustomErc20.to),
        contractAddress: transferCustomErc20.contractAddress ? this.fromXdcAddress(transferCustomErc20.contractAddress) : undefined,
      } as TransferCustomErc20;

      const transactionData = await prepareXdcCustomErc20SignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async getTransactionCount(address: string) {
        const client = await this.getClient(await this.isTestnet());
        return client.eth.getTransactionCount(this.fromXdcAddress(address), 'pending');
    }

    public async invokeSmartContractMethod(smartContractMethodInvocation: SmartContractMethodInvocation) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        const tx = {
          ...smartContractMethodInvocation,
          contractAddress: this.fromXdcAddress(smartContractMethodInvocation.contractAddress),
        } as SmartContractMethodInvocation;

        if (smartContractMethodInvocation.methodABI.stateMutability === 'view') {
            return sendXdcSmartContractReadMethodInvocationTransaction(tx, node);
        }

        const transactionData = await prepareXdcSmartContractWriteMethodInvocation(tx, node);
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async deployErc20(deploy: DeployErc20) {
      const tx = {
        ...deploy,
        address: this.fromXdcAddress(deploy.address),
      } as DeployErc20;

      const transactionData = await prepareXdcDeployErc20SignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
}
