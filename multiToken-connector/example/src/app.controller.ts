import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MultiTokenController } from '../../module';

@Controller()
export class AppController extends MultiTokenController {
  constructor(private readonly myService: AppService) {
    super(myService);
  }
}
