import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'pino-logger';
import { InjectPinoLogger } from 'nestjs-pino';
import { MultiTokenService } from '../../module';
import { celoBroadcast, Currency } from '../../module/node_modules/@tatumio/tatum';

@Injectable()
export class AppService extends MultiTokenService {
  protected broadcast(chain: Currency, txData: string, signatureId?: string) {
    // enter your test API KEY here to make broadcast work
    // process.env.TATUM_API_KEY = '';
    return celoBroadcast(txData, signatureId);
  }
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]> {
    switch (chain) {
      case Currency.ETH:
        return Promise.resolve(['https://ropsten.infura.io/v3/ab6162e91013410aa46123ef71b67da3']);
      case Currency.BSC:
        return Promise.resolve(['https://data-seed-prebsc-1-s1.binance.org:8545']);
      case Currency.CELO:
        return Promise.resolve(['https://alfajores-forno.celo-testnet.org']);
    }
  }

  protected isTestnet(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected storeKMSTransaction(
    txData: string,
    currency: string,
    signatureId: string[],
    index: number,
  ): Promise<string> {
    return Promise.resolve(txData);
  }
}
