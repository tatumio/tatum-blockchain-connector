import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'pino-logger';
import { InjectPinoLogger } from 'nestjs-pino';
import { XdcService } from '../../module';

@Injectable()
export class AppService extends XdcService {
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }
  protected getNodesUrl(testnet: boolean): Promise<string[]> {
    return Promise.resolve(['https://rpc.apothem.network/']);
  }

  protected isTestnet(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected async storeKMSTransaction(
    txData: string,
    currency: string,
    signatureId: string[],
    index: number,
  ): Promise<string> {
    this.logger.info(txData);
    return txData;
  }

  protected completeKMSTransaction(
    txId: string,
    signatureId: string,
  ): Promise<void> {
    this.logger.info(txId);
    return Promise.resolve();
  }
}
