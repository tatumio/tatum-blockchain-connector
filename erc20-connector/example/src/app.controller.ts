import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { Erc20Controller } from '../../module';

@Controller()
export class AppController extends Erc20Controller {
  constructor(private readonly myService: AppService) {
    super(myService);
  }
}
