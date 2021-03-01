import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { CardanoBlockchainInfo } from './constants';

export abstract class CardanoService {
  protected constructor(protected readonly logger: PinoLogger) {}

  protected abstract isTestnet(): Promise<boolean>;

  protected abstract getNodesUrl(): Promise<string[]>;

  public async getBlockChainInfo(): Promise<CardanoBlockchainInfo> {
    const testnet = await this.isTestnet();
    const [url] = await this.getNodesUrl();
    const { tip } = (
      await axios.post(`${url}/graphql`, {
        query: '{ cardano { tip { number slotNo epoch { number } }} }',
      })
    ).data.data.cardano;
    return {
      testnet,
      tip,
    };
  }
}
