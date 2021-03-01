import { PinoLogger } from 'nestjs-pino';
import { CardanoBlockchainInfo } from './constants';

export abstract class CardanoService {
  protected constructor(protected readonly logger: PinoLogger) {}

  protected abstract isTestnet(): Promise<boolean>;

  protected abstract getNodesUrl(): Promise<string[]>;

  public async getBlockChainInfo(): Promise<CardanoBlockchainInfo> {
    return { testnet: await this.isTestnet() };
  }
}
