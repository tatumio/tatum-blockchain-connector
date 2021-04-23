import { Injectable } from '@nestjs/common';
import { InjectPinoLogger } from 'nestjs-pino';
import { PinoLogger } from 'pino-logger';
import { TezosService } from '../../module/npm';

@Injectable()
export class AppService extends TezosService {
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected getRpcClient(): Promise<string> {
    // return Promise.resolve('https://mainnet-tezos.giganode.io');
    // return Promise.resolve('http://192.168.99.193:5001');
    return Promise.resolve('https://edonet-tezos.giganode.io');
  }

  protected getNodesUrl(): Promise<string> {
    return Promise.resolve('https://api.teztracker.com/v2/data/tezos/edonet');
    // return Promise.resolve('https://api.teztracker.com/v2/data/tezos/mainnet');
  }

}
