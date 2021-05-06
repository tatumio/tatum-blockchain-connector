import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'pino-logger';
import { InjectPinoLogger } from 'nestjs-pino';
import { Erc20Service } from '../../module';
import { celoBroadcast, Currency } from '@tatumio/tatum';

@Injectable()
export class AppService extends Erc20Service {
  protected broadcast(chain: Currency, txData: string, signatureId?: string) {
    // enter your test API KEY here to make broadcast work
    // process.env.TATUM_API_KEY = '';
    return celoBroadcast(txData, signatureId);
  }
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]> {
    return Promise.resolve(['https://alfajores-forno.celo-testnet.org']);
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
