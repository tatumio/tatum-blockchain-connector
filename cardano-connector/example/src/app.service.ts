import { Injectable } from '@nestjs/common';
import { InjectPinoLogger } from 'nestjs-pino';
import { PinoLogger } from 'pino-logger';
import { CardanoService } from '../../module/npm';

@Injectable()
export class AppService extends CardanoService {
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected isTestnet(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected getNodesUrl(): Promise<string[]> {
    return Promise.resolve(['http://127.0.0.1']);
  }

  protected getCardanoGraphQLPort(): Promise<number> {
    return Promise.resolve(3101);
  }
}
