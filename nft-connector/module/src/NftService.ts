import {PinoLogger} from 'nestjs-pino';
import BigNumber from 'bignumber.js';
import {NftError} from './NftError';
import {
    CeloBurnErc721,
    CeloDeployErc721,
    CeloMintErc721,
    CeloMintMultipleErc721,
    CeloTransferErc721,
    Currency,
    EthBurnErc721,
    EthDeployErc721,
    EthMintErc721,
    EthMintMultipleErc721,
    EthTransferErc721,
    prepareBscBurnBep721SignedTransaction,
    prepareBscDeployBep721SignedTransaction,
    prepareBscMintBep721SignedTransaction, prepareBscMintBepCashback721SignedTransaction,
    prepareBscMintMultipleBep721SignedTransaction, prepareBscMintMultipleCashbackBep721SignedTransaction,
    prepareBscTransferBep721SignedTransaction,
    prepareBscUpdateCashbackForAuthorErc721SignedTransaction,
    prepareCeloBurnErc721SignedTransaction,
    prepareCeloDeployErc721SignedTransaction, prepareCeloMintCashbackErc721SignedTransaction,
    prepareCeloMintErc721SignedTransaction, prepareCeloMintMultipleCashbackErc721SignedTransaction,
    prepareCeloMintMultipleErc721SignedTransaction,
    prepareCeloTransferErc721SignedTransaction,
    prepareCeloUpdateCashbackForAuthorErc721SignedTransaction,
    prepareEthBurnErc721SignedTransaction,
    prepareEthDeployErc721SignedTransaction, prepareEthMintCashbackErc721SignedTransaction,
    prepareEthMintErc721SignedTransaction, prepareEthMintMultipleCashbackErc721SignedTransaction,
    prepareEthMintMultipleErc721SignedTransaction,
    prepareEthTransferErc721SignedTransaction,
    prepareEthUpdateCashbackForAuthorErc721SignedTransaction,
    TransactionHash
} from '@tatumio/tatum';
import erc721_abi from '@tatumio/tatum/dist/src/contracts/erc721/erc721_abi';
import Web3 from 'web3';
import {Transaction, TransactionReceipt} from 'web3-eth';
import {CeloUpdateCashbackErc721} from '@tatumio/tatum/dist/src/model/request/CeloUpdateCashbackErc721';
import {UpdateCashbackErc721} from '@tatumio/tatum/dist/src/model/request/UpdateCashbackErc721';

export abstract class NftService {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]>;

    protected abstract broadcast(chain: Currency, txData: string, signatureId?: string)

    public async getMetadataErc721(chain: Currency, token: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.tokenURI(token).call()};
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getRoyaltyErc721(chain: Currency, token: string, contractAddress: string) {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            const [addresses, values] = await Promise.all([c.methods.tokenCashbackRecipients(token).call(), c.methods.tokenCashbackValues(token).call()]);
            return {addresses, values: values.map(c => new BigNumber(c).dividedBy(1e18).toString(10))};
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getTokensOfOwner(chain: Currency, address: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.tokensOfOwner(address).call()};
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
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
            throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async transferErc721(body: CeloTransferErc721 | EthTransferErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthTransferErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscTransferBep721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferErc721SignedTransaction(testnet, body as CeloTransferErc721, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintErc721(body: CeloMintErc721 | EthMintErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                if (!body.authorAddresses) {
                    txData = await prepareEthMintErc721SignedTransaction(body, provider);
                } else {
                    txData = await prepareEthMintCashbackErc721SignedTransaction(body, provider);
                }
                break;
            case Currency.BSC:
                if (!body.authorAddresses) {
                    txData = await prepareBscMintBep721SignedTransaction(body, provider);
                } else {
                    txData = await prepareBscMintBepCashback721SignedTransaction(body, provider);
                }
                break;
            case Currency.CELO:
                if (!body.authorAddresses) {
                    txData = await prepareCeloMintErc721SignedTransaction(testnet, body as CeloMintErc721, provider);
                } else {
                    txData = await prepareCeloMintCashbackErc721SignedTransaction(testnet, body as CeloMintErc721, provider);
                }
                break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintMultipleErc721(body: CeloMintMultipleErc721 | EthMintMultipleErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                if (!body.authorAddresses) {
                    txData = await prepareEthMintMultipleErc721SignedTransaction(body, provider);
                } else {
                    txData = await prepareEthMintMultipleCashbackErc721SignedTransaction(body, provider);
                }
                break;
            case Currency.BSC:
                if (!body.authorAddresses) {
                    txData = await prepareBscMintMultipleBep721SignedTransaction(body, provider);
                } else {
                    txData = await prepareBscMintMultipleCashbackBep721SignedTransaction(body, provider);
                }
                break;
            case Currency.CELO:
                if (!body.authorAddresses) {
                    txData = await prepareCeloMintMultipleErc721SignedTransaction(testnet, body as CeloMintMultipleErc721, provider);
                } else {
                    txData = await prepareCeloMintMultipleCashbackErc721SignedTransaction(testnet, body as CeloMintMultipleErc721, provider);
                }
                break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async updateCashbackForAuthor(body: CeloUpdateCashbackErc721 | UpdateCashbackErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthUpdateCashbackForAuthorErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscUpdateCashbackForAuthorErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloUpdateCashbackForAuthorErc721SignedTransaction(testnet, body as CeloUpdateCashbackErc721, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnErc721(body: CeloBurnErc721 | EthBurnErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBurnBep721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnErc721SignedTransaction(testnet, body as CeloBurnErc721, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async deployErc721(body: CeloDeployErc721 | EthDeployErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthDeployErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscDeployBep721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployErc721SignedTransaction(testnet, body as CeloDeployErc721, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    private async getClient(chain: Currency, testnet: boolean) {
        return new Web3((await this.getNodesUrl(chain, testnet))[0]);
    }
}
