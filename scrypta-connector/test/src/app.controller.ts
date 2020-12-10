import { Controller, Get } from '@nestjs/common';
import { ScryptaBlockchainService } from '@scrypta/tatum'

@Controller()
export class AppController {
  scrypta: any
  constructor() {
    this.scrypta = new ScryptaBlockchainService(false, ["http://localhost:3001"], true)
  }

  @Get('/v3/scrypta/info')
  async getInfo(): Promise<object> {
    return await this.scrypta.getBlockChainInfo()
  }
}
