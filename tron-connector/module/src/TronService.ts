import {PinoLogger} from 'nestjs-pino';
import axios from 'axios';
import {
    convertAddressFromHex,
    CreateTronTrc10,
    CreateTronTrc20,
    Currency,
    FreezeTron,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    prepareTronCreateTrc10SignedKMSTransaction,
    prepareTronCreateTrc10SignedTransaction,
    prepareTronCreateTrc20SignedKMSTransaction,
    prepareTronCreateTrc20SignedTransaction,
    prepareTronFreezeKMSTransaction,
    prepareTronFreezeTransaction,
    prepareTronSignedKMSTransaction,
    prepareTronSignedTransaction,
    prepareTronTrc10SignedKMSTransaction,
    prepareTronTrc10SignedTransaction,
    prepareTronTrc20SignedKMSTransaction,
    prepareTronTrc20SignedTransaction,
    TransferTron,
    TransferTronTrc10,
    TransferTronTrc20,
    TronAccount,
    TronBlock,
    TronTransaction,
    TronTrc10
} from '@tatumio/tatum';
import {Trc20Tx} from './dto/Trc20Tx';
import {TronError} from './TronError';

export abstract class TronService {

    private static mapTransaction(t: any): TronTransaction {

        if (t.internal_tx_id) {
            return {...t, fromAddressBase58: convertAddressFromHex(t.from_address), toAddressBase58: convertAddressFromHex(t.to_address)}
        }
        const rawData = {...t.raw_data};
        rawData.contract = rawData.contract?.map(c => ({
            ...c,
            parameter: {
                ...c.parameter,
                value: {
                    ...c.parameter.value,
                    ownerAddressBase58: convertAddressFromHex(c.parameter.value.owner_address),
                    toAddressBase58: convertAddressFromHex(c.parameter.value.to_address),
                    contractAddressBase58: convertAddressFromHex(c.parameter.value.contract_address),
                }
            }
        })) || [];

        return {
            ret: t.ret,
            signature: t.signature,
            blockNumber: t.blockNumber,
            txID: t.txID,
            netFee: t.net_fee,
            netUsage: t.net_usage,
            energyFee: t.energy_fee,
            energyUsage: t.energy_usage,
            energyUsageTotal: t.energy_usage_total,
            internalTransactions: t.internal_transactions,
            rawData: rawData,
        };
    }

    private static mapTransaction20(t: any): Trc20Tx {
        return {
            txID: t.transaction_id,
            tokenInfo: t.token_info,
            from: t.from,
            to: t.to,
            type: t.type,
            value: t.value,
        };
    }

    private async getNodeAddress(): Promise<string> {
        return (await this.isTestnet()) ? 'https://api.shasta.trongrid.io' : 'https://api.trongrid.io';
    }

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>;

    protected abstract getApiKey(): string;

    protected abstract getScanningApiKey(): string;

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    public async broadcast(txData: string, signatureId?: string) {
        const transaction = JSON.parse(txData);
        if (Date.now() > transaction?.raw_data?.expiration) {
            throw new TronError('Transaction expired', 'tron.error');
        }
        const url = (await this.getNodesUrl(await this.isTestnet()))[0];
        const broadcast = (await axios.post(`${url}/wallet/broadcasttransaction`, transaction, {headers: {'TRON-PRO-API-KEY': this.getApiKey()}})).data;
        if (broadcast.result) {
            if (signatureId) {
                try {
                    await this.completeKMSTransaction(broadcast.txid, signatureId);
                } catch (e) {
                    this.logger.error(e);
                    return {txId: broadcast.txid, failed: true};
                }
            }
            return {txId: broadcast.txid};
        }
        throw new TronError(`Broadcast failed due to ${broadcast.message}`, 'tron.error');
    }

    public async getBlockChainInfo(testnet?: boolean): Promise<{ testnet: boolean, hash: string, blockNumber: number }> {
        let t: boolean;
        let apiKey: string;
        if (testnet !== undefined) {
            t = testnet;
            apiKey = this.getScanningApiKey();
        } else {
            t = await this.isTestnet();
            apiKey = this.getApiKey();
        }
        const urls = await this.getNodesUrl(t);
        const block = (await axios.post(urls[0] + '/wallet/getnowblock', undefined, {headers: {'TRON-PRO-API-KEY': apiKey}})).data;
        return {testnet: t, hash: block.blockID, blockNumber: block.block_header.raw_data.number};
    }

    public async getBlock(hashOrHeight: string, testnet?: boolean): Promise<TronBlock> {
        let t: boolean;
        let apiKey: string;
        if (testnet !== undefined) {
            t = testnet;
            apiKey = this.getScanningApiKey();
        } else {
            t = await this.isTestnet();
            apiKey = this.getApiKey();
        }
        const url = (await this.getNodesUrl(t))[0];
        let block;
        if (hashOrHeight.length > 32) {
            block = (await axios.post(`${url}/wallet/getblockbyid`, {value: hashOrHeight}, {headers: {'TRON-PRO-API-KEY': apiKey}})).data;
        } else {
            block = (await axios.post(`${url}/wallet/getblockbynum`, {num: parseInt(hashOrHeight)}, {headers: {'TRON-PRO-API-KEY': apiKey}})).data;
        }
        return {
            blockNumber: block.block_header.raw_data.number,
            hash: block.blockID,
            parentHash: block.block_header.raw_data.parentHash,
            timestamp: block.block_header.raw_data.timestamp,
            witnessAddress: block.block_header.raw_data.witness_address,
            witnessSignature: block.block_header.witness_signature,
            transactions: block.transactions?.map(TronService.mapTransaction) || [],
        };
    }

    public async getTransaction(txId: string, testnet?: boolean): Promise<TronTransaction> {
        const url = (await this.getNodesUrl(testnet !== undefined ? testnet : await this.isTestnet()))[0];
        let apiKey1, apiKey2: string;
        if (testnet !== undefined) {
            apiKey1 = this.getScanningApiKey();
            apiKey2 = this.getScanningApiKey();
        } else {
            apiKey1 = this.getApiKey();
            apiKey2 = this.getApiKey();
        }
        const [{data: tx}, {data: info}] = await Promise.all([axios.post(`${url}/wallet/gettransactionbyid`, {value: txId}, {headers: {'TRON-PRO-API-KEY': apiKey1}}),
            axios.post(`${url}/wallet/gettransactioninfobyid`, {value: txId}, {headers: {'TRON-PRO-API-KEY': apiKey2}})]);
        return TronService.mapTransaction({...tx, ...info.receipt, blockNumber: info.blockNumber});
    }

    public async getAccount(address: string): Promise<TronAccount> {
        const url = await this.getNodeAddress();
        const {data} = (await axios.get(`${url}/v1/accounts/${address}`, {headers: {'TRON-PRO-API-KEY': this.getApiKey()}})).data;
        if (!data?.length) {
            throw new TronError('no such account.', 'tron.error');
        }
        const account = data[0];
        return {
            address: account.add,
            assetIssuedId: account.asset_issued_ID,
            assetIssuedName: account.asset_issued_name,
            balance: account.balance,
            createTime: account.create_time,
            freeNetUsage: account.free_net_usage,
            trc10: account.assetV2,
            trc20: account.trc20,
        };
    }

    public async getTransactionsByAccount(address: string, next?: string): Promise<{ transactions: TronTransaction[], internalTransactions: TronTransaction[], next?: string }> {
        const url = await this.getNodeAddress();
        let u = `${url}/v1/accounts/${address}/transactions?limit=200`;
        if (next) {
            u += '&fingerprint=' + next;
        }
        const result = (await axios.get(u, {headers: {'TRON-PRO-API-KEY': this.getApiKey()}})).data;
        return {
            transactions: result.data.map(TronService.mapTransaction).filter(t => !t.internal_tx_id),
            internalTransactions: result.data.map(TronService.mapTransaction).filter(t => t.internal_tx_id),
            next: result.meta?.fingerprint
        };
    }

    public async getTrc20TransactionsByAccount(address: string, next?: string): Promise<{ transactions: Trc20Tx[], next?: string }> {
        const url = await this.getNodeAddress();
        let u = `${url}/v1/accounts/${address}/transactions/trc20?limit=200`;
        if (next) {
            u += '&fingerprint=' + next;
        }
        const result = (await axios.get(u, {headers: {'TRON-PRO-API-KEY': this.getApiKey()}})).data;
        return {
            transactions: result.data.map(TronService.mapTransaction20),
            next: result.meta?.fingerprint
        };
    }

    public async generateWallet(mnem?: string) {
        return generateWallet(Currency.TRON, await this.isTestnet(), mnem);
    }

    public async generateAddress(xpub: string, i: number) {
        return {address: await generateAddressFromXPub(Currency.TRON, await this.isTestnet(), xpub, i)};
    }

    public async generatePrivateKey(mnemonic: string, i: number) {
        return {key: await generatePrivateKeyFromMnemonic(Currency.TRON, await this.isTestnet(), mnemonic, i)};
    }

    public async sendTransaction(body: TransferTron) {
        const t = await this.isTestnet();
        if (body.signatureId) {
            const txData = await prepareTronSignedKMSTransaction(t, body, (await this.getNodesUrl(t))[0]);
            return {signatureId: await this.storeKMSTransaction(txData, Currency.TRON, [body.signatureId], body.index)};
        } else {
            return this.broadcast(await prepareTronSignedTransaction(t, body, (await this.getNodesUrl(t))[0]));
        }
    }

    public async sendTrc10Transaction(body: TransferTronTrc10) {
        const t = await this.isTestnet();
        if (body.signatureId) {
            const txData = await prepareTronTrc10SignedKMSTransaction(t, body, undefined, (await this.getNodesUrl(t))[0]);
            return {signatureId: await this.storeKMSTransaction(txData, Currency.TRON, [body.signatureId], body.index)};
        } else {
            return this.broadcast(await prepareTronTrc10SignedTransaction(t, body, undefined, (await this.getNodesUrl(t))[0]));
        }
    }

    public async sendTrc20Transaction(body: TransferTronTrc20) {
        const t = await this.isTestnet();
        if (body.signatureId) {
            const txData = await prepareTronTrc20SignedKMSTransaction(t, body, (await this.getNodesUrl(t))[0]);
            return {signatureId: await this.storeKMSTransaction(txData, Currency.TRON, [body.signatureId], body.index)};
        } else {
            return this.broadcast(await prepareTronTrc20SignedTransaction(t, body, (await this.getNodesUrl(t))[0]));
        }
    }

    public async createTrc10Transaction(body: CreateTronTrc10) {
        const t = await this.isTestnet();
        if (body.signatureId) {
            const txData = await prepareTronCreateTrc10SignedKMSTransaction(t, body, (await this.getNodesUrl(t))[0]);
            return {signatureId: await this.storeKMSTransaction(txData, Currency.TRON, [body.signatureId], body.index)};
        } else {
            return this.broadcast(await prepareTronCreateTrc10SignedTransaction(t, body, (await this.getNodesUrl(t))[0]));
        }
    }

    public async createTrc20Transaction(body: CreateTronTrc20) {
        const t = await this.isTestnet();
        if (body.signatureId) {
            const txData = await prepareTronCreateTrc20SignedKMSTransaction(t, body, (await this.getNodesUrl(t))[0]);
            return {signatureId: await this.storeKMSTransaction(txData, Currency.TRON, [body.signatureId], body.index)};
        } else {
            return this.broadcast(await prepareTronCreateTrc20SignedTransaction(t, body, (await this.getNodesUrl(t))[0]));
        }
    }

    public async freezeBalance(body: FreezeTron) {
        const t = await this.isTestnet();
        if (body.signatureId) {
            const txData = await prepareTronFreezeKMSTransaction(t, body, (await this.getNodesUrl(t))[0]);
            return {signatureId: await this.storeKMSTransaction(txData, Currency.TRON, [body.signatureId], body.index)};
        } else {
            return this.broadcast(await prepareTronFreezeTransaction(t, body, (await this.getNodesUrl(t))[0]));
        }
    }

    public async getTrc10Detail(id: string): Promise<TronTrc10> {
        const url = `${(await this.getNodeAddress())}/v1/assets/${id}`;
        const {data} = (await axios.get(url, {headers: {'TRON-PRO-API-KEY': this.getApiKey()}})).data;
        if (!data?.length) {
            throw new TronError('No such asset.', 'tron.error');
        }
        return {
            abbr: data[0].abbr,
            description: data[0].description,
            id: data[0].id,
            name: data[0].name,
            ownerAddress: data[0].owner_address,
            precision: data[0].precision,
            totalSupply: data[0].total_supply,
            url: data[0].url,
        };
    }
}
