import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { XdcController } from '../../module';

@Controller()
export class AppController extends XdcController {
  constructor(private readonly xdcService: AppService) {
    super(xdcService);
  }
}
