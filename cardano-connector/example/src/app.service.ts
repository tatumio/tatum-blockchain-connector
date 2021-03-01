import { Injectable } from '@nestjs/common';
import { InjectPinoLogger } from 'nestjs-pino';
import { PinoLogger } from 'pino-logger';
import { CardanoService } from '../../module/npm';

@Injectable()
export class AppService extends CardanoService {
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected getNodesUrl(): Promise<string[]> {
    // https://github.com/input-output-hk/cardano-graphql
    return Promise.resolve(['http://127.0.0.1:3100']);
  }

  protected isTestnet(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
