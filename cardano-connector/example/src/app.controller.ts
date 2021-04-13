import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { CardanoController } from '../../module/npm';

@Controller()
export class AppController extends CardanoController {
  constructor(private readonly cardanoService: AppService) {
    super(cardanoService);
  }
}
