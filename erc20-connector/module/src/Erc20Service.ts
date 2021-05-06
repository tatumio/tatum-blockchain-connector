import Web3 from 'web3';
import {Transaction, TransactionReceipt} from 'web3-eth';
import {PinoLogger} from 'nestjs-pino';
import {Erc20Error} from './Erc20Error';
import {
    MintCeloErc20,
    BurnCeloErc20,
    DeployCeloErc20,
    Currency,
    ethBroadcast,
    DeployErc20,
    MintErc20,
    BurnErc20,
    TransferEthErc20,
    prepareDeployErc20SignedTransaction,
    prepareEthMintErc20SignedTransaction,
    prepareEthOrErc20SignedTransaction,
    prepareEthBurnErc20SignedTransaction,
    bscBroadcast,
    TransferBscBep20,
    TransferCeloOrCeloErc20Token,
    prepareDeployBep20SignedTransaction,
    prepareMintBep20SignedTransaction,
    prepareBurnBep20SignedTransaction,
    prepareBscOrBep20SignedTransaction,
    celoBroadcast,
    prepareCeloBurnErc20SignedTransaction,
    prepareCeloDeployErc20SignedTransaction,
    prepareCeloMintErc20SignedTransaction,
    prepareCeloTransferErc20SignedTransaction,
    // tronBroadcast,
    CreateTronTrc20,
    TransferTronTrc20,
    prepareTronCreateTrc20SignedTransaction,
    prepareTronCreateTrc20SignedKMSTransaction,
    prepareTronTrc20SignedTransaction,
    TransactionHash
} from '@tatumio/tatum';
import erc20_abi from '@tatumio/tatum/dist/src/contracts/erc20/token_abi';
// import { CONTRACT_ADDRESSES } from '@tatumio/tatum/dist/src/constants';

export abstract class Erc20Service {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]>;

    private async getFirstNodeUrl(chain: Currency, testnet: boolean): Promise<string> {
      const nodes = await this.getNodesUrl(chain, testnet);
      if (nodes.length === 0) {
          new Erc20Error('Nodes url array must have at least one element.', 'erc20.nodes.url');
      }
      return nodes[0];
    }

    private async getClient(chain: Currency, testnet: boolean) {
      if ([Currency.ETH, Currency.BSC, Currency.CELO].includes(chain)) {
        return new Web3((await this.getFirstNodeUrl(chain, testnet)));
      }
      
      throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
    }

    protected broadcast(chain: Currency, txData: string, signatureId?: string) {
      if (chain === Currency.ETH) {
        return ethBroadcast(txData, signatureId)
      } else
      if (chain === Currency.BSC) {
        return bscBroadcast(txData, signatureId)
      } else
      if (chain === Currency.CELO) {
        return celoBroadcast(txData)
      // } else
      // if (chain === Currency.TRON) {
      //  return tronBroadcast(txData)
      }

      return null
    }

    public async getErc20Balance(chain: Currency, address: string, contractAddress: string): Promise<{ balance: string }> {
        let contractOrAddress;
        switch (chain) {
            case Currency.ETH:
                contractOrAddress = contractAddress;
                break;
            case Currency.BSC:
                contractOrAddress = contractAddress;
                break;
            case Currency.CELO:
                contractOrAddress = contractAddress;
                break;
            // case Currency.TRON:
            //     // TODO!!!
            //     break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }

        const client = await this.getClient(chain, await this.isTestnet())
        // @ts-ignore
        const contract = new client.eth.Contract(erc20_abi, contractOrAddress);
        return { balance: await contract.methods.balanceOf(address).call() }
    }
  
    public async transferErc20(chain: Currency, body: TransferEthErc20 | TransferBscBep20 | TransferCeloOrCeloErc20Token | TransferTronTrc20):
        Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthOrErc20SignedTransaction(body as TransferEthErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareBscOrBep20SignedTransaction(body as TransferBscBep20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferErc20SignedTransaction(testnet, body as TransferCeloOrCeloErc20Token, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            // case Currency.TRON:
            //     txData = await prepareTronTrc20SignedTransaction(testnet, body as TransferTronTrc20);
            //     break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body['index'])};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnErc20(chain: Currency, body: BurnErc20 | BurnCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnErc20SignedTransaction(body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareBurnBep20SignedTransaction(body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnErc20SignedTransaction(testnet, body as BurnCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            // case Currency.TRON:
            //     // TODO!!!
            //     break
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body['index'])};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintErc20(chain: Currency, body: MintErc20 | MintCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthMintErc20SignedTransaction(body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareMintBep20SignedTransaction(body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloMintErc20SignedTransaction(testnet, body as MintCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            // case Currency.TRON:
            //     // TODO!!!
            //     break
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body['index'])};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async deployErc20(chain: Currency, body: DeployErc20 | DeployCeloErc20 | CreateTronTrc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareDeployErc20SignedTransaction(body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareDeployBep20SignedTransaction(body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployErc20SignedTransaction(testnet, body as DeployCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            // case Currency.TRON:
            //     if (body.signatureId) {
            //         txData = await prepareTronCreateTrc20SignedKMSTransaction(testnet, body as CreateTronTrc20);
            //     } else {
            //         txData = await prepareTronCreateTrc20SignedTransaction(testnet, body as CreateTronTrc20);
            //     }
            //     break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body['index'])};
        } else {
            return this.broadcast(chain, txData);
        }
    }
}
