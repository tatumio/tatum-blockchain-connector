import { Injectable } from '@nestjs/common';
import { InjectPinoLogger } from 'nestjs-pino';
import { PinoLogger } from 'pino-logger';
import { AdaService } from '../../module';

@Injectable()
export class AppService extends AdaService {
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected isTestnet(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected getNodesUrl(): Promise<string[]> {
    return Promise.resolve(['http://51.75.161.255:3100/graphql']);
  }

  protected getAdaGraphQLPort(): Promise<number> {
    return Promise.resolve(3100);
  }
}
