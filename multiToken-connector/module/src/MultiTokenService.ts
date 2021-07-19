import {PinoLogger} from 'nestjs-pino';
import {MultiTokenError} from './MultiTokenError';
import {
    CeloBurnMultiToken,
    CeloBurnMultiTokenBatch,
    CeloDeployMultiToken,
    CeloMintMultiToken,
    CeloMintMultiTokenBatch,
    CeloTransferMultiToken,
    CeloTransferMultiTokenBatch,
    Currency,
    EthBurnMultiToken,
    EthBurnMultiTokenBatch,
    EthDeployMultiToken,
    MintMultiToken,
    MintMultiTokenBatch,
    OneBurnMultiToken,
    OneBurnMultiTokenBatch,
    OneDeployMultiToken,
    OneMintMultiToken,
    OneMintMultiTokenBatch,
    OneTransferMultiToken,
    OneTransferMultiTokenBatch,
    prepareBscBatchTransferMultiTokenSignedTransaction,
    prepareBscBurnMultiTokenBatchSignedTransaction,
    prepareBscBurnMultiTokenSignedTransaction,
    prepareBscDeployMultiTokenSignedTransaction,
    prepareBscMintMultiTokenBatchSignedTransaction,
    prepareBscMintMultiTokenSignedTransaction,
    prepareBscTransferMultiTokenSignedTransaction,
    prepareCeloBatchTransferMultiTokenSignedTransaction,
    prepareCeloBurnMultiTokenBatchSignedTransaction,
    prepareCeloBurnMultiTokenSignedTransaction,
    prepareCeloDeployMultiTokenSignedTransaction,
    prepareCeloMintMultiTokenBatchSignedTransaction,
    prepareCeloMintMultiTokenSignedTransaction,
    prepareCeloTransferMultiTokenSignedTransaction,
    prepareEthBatchTransferMultiTokenSignedTransaction,
    prepareEthBurnBatchMultiTokenSignedTransaction,
    prepareEthBurnMultiTokenSignedTransaction,
    prepareEthDeployMultiTokenSignedTransaction,
    prepareEthMintMultiTokenBatchSignedTransaction,
    prepareEthMintMultiTokenSignedTransaction,
    prepareEthTransferMultiTokenSignedTransaction,
    prepareOneBatchTransferMultiTokenSignedTransaction,
    prepareOneBurnMultiTokenBatchSignedTransaction,
    prepareOneBurnMultiTokenSignedTransaction,
    prepareOneDeployMultiTokenSignedTransaction,
    prepareOneMintMultiTokenBatchSignedTransaction,
    prepareOneMintMultiTokenSignedTransaction,
    prepareOneTransferMultiTokenSignedTransaction,
    preparePolygonTransferMultiTokenSignedTransaction,
    preparePolygonBatchTransferMultiTokenSignedTransaction,
    preparePolygonMintMultiTokenSignedTransaction,
    preparePolygonMintMultiTokenBatchSignedTransaction,
    preparePolygonBurnMultiTokenSignedTransaction,
    preparePolygonBurnMultiTokenBatchSignedTransaction,
    preparePolygonDeployMultiTokenSignedTransaction,
    TransactionHash,
    TransferMultiToken,
    TransferMultiTokenBatch,
} from '@tatumio/tatum';
import erc1155_abi from '@tatumio/tatum/dist/src/contracts/erc1155/erc1155_abi';
import Web3 from 'web3';
import {Transaction, TransactionReceipt} from 'web3-eth';
import {HarmonyAddress} from '@harmony-js/crypto';

export abstract class MultiTokenService {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]>;

    protected abstract broadcast(chain: Currency, txData: string, signatureId?: string)

    public async getMetadataMultiToken(chain: Currency, token: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc1155_abi, chain === Currency.ONE ? new HarmonyAddress(contractAddress).basicHex : contractAddress);
        try {
            return {data: (await c.methods.uri(token).call()).replace('{id}', token)};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError(`Unable to obtain information for token. ${e}`, 'multitoken.failed');
        }
    }


    public async getTokensOfOwner(chain: Currency, address: string, tokenId: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc1155_abi, chain === Currency.ONE ? new HarmonyAddress(contractAddress).basicHex : contractAddress);
        try {
            return {data: await c.methods.balanceOf(address, tokenId).call()};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError(`Unable to obtain information for token. ${e}`, 'multitoken.failed');
        }
    }

    public async getTokensOfOwnerBatch(chain: Currency, address: string[], tokenId: string[], contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc1155_abi, chain === Currency.ONE ? new HarmonyAddress(contractAddress).basicHex : contractAddress);
        try {
            return {data: await c.methods.balanceOfBatch(address, tokenId).call()};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError(`Unable to obtain information for token. ${e}`, 'multitoken.failed');
        }
    }

    public async getTransaction(chain: Currency, txId: string): Promise<Transaction & TransactionReceipt> {
        try {
            const web3 = await this.getClient(chain, await this.isTestnet());
            const {r, s, v, hash, ...transaction} = (await web3.eth.getTransaction(txId)) as any;
            let receipt: TransactionReceipt = undefined;
            try {
                receipt = await web3.eth.getTransactionReceipt(hash);
            } catch (_) {
                transaction.transactionHash = hash;
            }
            return {...transaction, ...receipt};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async transferMultiToken(body: CeloTransferMultiToken | TransferMultiToken | OneTransferMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.MATIC:
                txData = await preparePolygonTransferMultiTokenSignedTransaction(testnet, body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferMultiTokenSignedTransaction(testnet, body as CeloTransferMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.ONE:
                txData = await prepareOneTransferMultiTokenSignedTransaction(testnet, body as OneTransferMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async transferMultiTokenBatch(body: CeloTransferMultiTokenBatch | TransferMultiTokenBatch | OneTransferMultiTokenBatch): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBatchTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.MATIC:
                txData = await preparePolygonBatchTransferMultiTokenSignedTransaction(testnet, body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBatchTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBatchTransferMultiTokenSignedTransaction(testnet, body as CeloTransferMultiTokenBatch, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.ONE:
                txData = await prepareOneBatchTransferMultiTokenSignedTransaction(testnet, body as OneTransferMultiTokenBatch, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintMultiToken(body: CeloMintMultiToken | MintMultiToken | OneMintMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthMintMultiTokenSignedTransaction(body, provider);
                break;
            case Currency.MATIC:
                txData = await preparePolygonMintMultiTokenSignedTransaction(testnet, body, provider);
                break;
            case Currency.BSC:
                txData = await prepareBscMintMultiTokenSignedTransaction(body, provider);
                break;
            case Currency.CELO:
                txData = await prepareCeloMintMultiTokenSignedTransaction(testnet, body as CeloMintMultiToken, provider);
                break;
            case Currency.ONE:
                txData = await prepareOneMintMultiTokenSignedTransaction(testnet, body as OneMintMultiToken, provider);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintMultiTokenBatch(body: CeloMintMultiTokenBatch | MintMultiTokenBatch | OneMintMultiTokenBatch): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthMintMultiTokenBatchSignedTransaction(body, provider);
                break;
            case Currency.MATIC:
                txData = await preparePolygonMintMultiTokenBatchSignedTransaction(testnet, body, provider);
                break;
            case Currency.BSC:
                txData = await prepareBscMintMultiTokenBatchSignedTransaction(body, provider);
                break;
            case Currency.CELO:
                txData = await prepareCeloMintMultiTokenBatchSignedTransaction(testnet, body as CeloMintMultiTokenBatch, provider);
                break;
            case Currency.ONE:
                txData = await prepareOneMintMultiTokenBatchSignedTransaction(testnet, body as OneMintMultiTokenBatch, provider);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnMultiToken(body: CeloBurnMultiToken | EthBurnMultiToken | OneBurnMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.MATIC:
                txData = await preparePolygonBurnMultiTokenSignedTransaction(testnet, body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBurnMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnMultiTokenSignedTransaction(testnet, body as CeloBurnMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.ONE:
                txData = await prepareOneBurnMultiTokenSignedTransaction(testnet, body as OneBurnMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnMultiTokenBatch(body: CeloBurnMultiTokenBatch | EthBurnMultiTokenBatch | OneBurnMultiTokenBatch): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnBatchMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.MATIC:
                txData = await preparePolygonBurnMultiTokenBatchSignedTransaction(testnet, body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBurnMultiTokenBatchSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnMultiTokenBatchSignedTransaction(testnet, body as CeloBurnMultiTokenBatch, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.ONE:
                txData = await prepareOneBurnMultiTokenBatchSignedTransaction(testnet, body as OneBurnMultiTokenBatch, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async deployMultiToken(body: CeloDeployMultiToken | EthDeployMultiToken | OneDeployMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthDeployMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.MATIC:
                txData = await preparePolygonDeployMultiTokenSignedTransaction(testnet, body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscDeployMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployMultiTokenSignedTransaction(testnet, body as CeloDeployMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.ONE:
                txData = await prepareOneDeployMultiTokenSignedTransaction(testnet, body as OneDeployMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async getContractAddress(chain: Currency, txId: string) {
        try {
            const web3 = await this.getClient(chain, await this.isTestnet());
            const {contractAddress} = await web3.eth.getTransactionReceipt(txId);
            return {contractAddress};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    private async getClient(chain: Currency, testnet: boolean) {
        return new Web3((await this.getNodesUrl(chain, testnet))[0]);
    }
}
