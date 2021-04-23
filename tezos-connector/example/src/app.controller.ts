import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { TezosController } from '../../module/npm';

@Controller()
export class AppController extends TezosController {
  constructor(private readonly TezosService: AppService) {
    super(TezosService);
  }
}
