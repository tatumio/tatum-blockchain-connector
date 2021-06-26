import { Controller } from '@nestjs/common';
import { AppService } from './app.service'
import { AdaController } from '../../module'

@Controller()
export class AppController extends AdaController {
  constructor(private readonly adaService: AppService) {
    super(adaService);
  }
}
