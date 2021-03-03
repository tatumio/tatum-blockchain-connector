import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { CardanoBlockchainInfo, WalletId } from './constants';
import { GenerateWalletMnemonic } from './dto/GenerateWalletMnemonic';

export abstract class CardanoService {
  protected constructor(protected readonly logger: PinoLogger) {}

  protected abstract isTestnet(): Promise<boolean>;

  protected abstract getNodesUrl(): Promise<string[]>;

  protected abstract getCardanoGraphQLPort(): Promise<number>;

  protected abstract getCardanoWalletPort(): Promise<number>;

  protected abstract getCardanoWalletUrls(): Promise<string[]>;

  public async getBlockChainInfo(): Promise<CardanoBlockchainInfo> {
    const testnet = await this.isTestnet();
    const [url] = await this.getNodesUrl();
    const port = await this.getCardanoGraphQLPort();
    const { tip } = (
      await axios.post(`${url}:${port}/graphql`, {
        query: '{ cardano { tip { number slotNo epoch { number } }} }',
      })
    ).data.data.cardano;
    return {
      testnet,
      tip,
    };
  }

  public async generateWallet(req: GenerateWalletMnemonic): Promise<WalletId> {
    const [url] = await this.getNodesUrl();
    const port = await this.getCardanoWalletPort();
    return (await axios.post(`${url}:${port}/v2/wallets`, req)).data.id;
  }
}
