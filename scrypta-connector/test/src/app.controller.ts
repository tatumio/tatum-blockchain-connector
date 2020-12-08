import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ScryptaReady } from '@scrypta/tatum'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): object {
    return ScryptaReady()
  }
}
