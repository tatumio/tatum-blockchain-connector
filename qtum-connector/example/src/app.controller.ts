import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { QtumController } from '../../module';

@Controller()
export class AppController extends QtumController {
  constructor(private readonly quorumService: AppService) {
    super(quorumService);
  }
}
