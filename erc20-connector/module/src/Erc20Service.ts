import Web3 from 'web3';
import {Transaction, TransactionReceipt} from 'web3-eth';
import {PinoLogger} from 'nestjs-pino';
import {Erc20Error} from './Erc20Error';
import {
  ChainBurnErc20,
  ChainDeployErc20,
  ChainMintErc20,
  ChainTransferEthErc20,
  ChainTransferBscBep20,
  ChainBurnCeloErc20,
  ChainDeployCeloErc20,
  ChainMintCeloErc20,
  ChainTransferCeloErc20Token,
  // ChainTransferTronTrc20,
  // ChainCreateTronTrc20,
} from './Erc20Base';
import {
    MintCeloErc20,
    BurnCeloErc20,
    DeployCeloErc20,
    Currency,
    DeployErc20,
    MintErc20,
    BurnErc20,
    TransferEthErc20,
    prepareDeployErc20SignedTransaction,
    prepareEthMintErc20SignedTransaction,
    prepareEthOrErc20SignedTransaction,
    prepareEthBurnErc20SignedTransaction,
    TransferBscBep20,
    TransferCeloOrCeloErc20Token,
    prepareDeployBep20SignedTransaction,
    prepareMintBep20SignedTransaction,
    prepareBurnBep20SignedTransaction,
    prepareBscOrBep20SignedTransaction,
    prepareCeloBurnErc20SignedTransaction,
    prepareCeloDeployErc20SignedTransaction,
    prepareCeloMintErc20SignedTransaction,
    prepareCeloTransferErc20SignedTransaction,
    TransactionHash
} from '@tatumio/tatum';
import erc20_abi from '@tatumio/tatum/dist/src/contracts/erc20/token_abi';

export abstract class Erc20Service {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]>;

    protected abstract broadcast(chain: Currency, txData: string, signatureId?: string): Promise<TransactionHash>;

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
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }

        const client = await this.getClient(chain, await this.isTestnet())
        // @ts-ignore
        const contract = new client.eth.Contract(erc20_abi, contractOrAddress);
        return { balance: await contract.methods.balanceOf(address).call() }
    }
  
    public async transferErc20(body: ChainTransferEthErc20 | ChainTransferBscBep20 | ChainTransferCeloErc20Token):
        Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const { chain, ..._body } = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthOrErc20SignedTransaction(_body as TransferEthErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareBscOrBep20SignedTransaction(_body as TransferBscBep20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferErc20SignedTransaction(testnet, _body as TransferCeloOrCeloErc20Token, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnErc20(body: ChainBurnErc20 | ChainBurnCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const { chain, ..._body } = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnErc20SignedTransaction(_body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareBurnBep20SignedTransaction(_body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnErc20SignedTransaction(testnet, _body as BurnCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintErc20(body: ChainMintErc20 | ChainMintCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const { chain, ..._body } = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthMintErc20SignedTransaction(_body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareMintBep20SignedTransaction(_body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloMintErc20SignedTransaction(testnet, _body as MintCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async deployErc20(body: ChainDeployErc20 | ChainDeployCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const { chain, ..._body } = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareDeployErc20SignedTransaction(_body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareDeployBep20SignedTransaction(_body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployErc20SignedTransaction(testnet, _body as DeployCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }
}
