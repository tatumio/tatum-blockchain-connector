import { PinoLogger } from 'nestjs-pino';
import axios from 'axios';
import {
  generateXtzWallet,
  Wallet,
  generateAddressFromXPub,
  generatePrivateKeyFromMnemonic,
  Currency,
  TransferXtz,
  sendXtzTransaction,
  broadcastXtzTransaction,
} from '@tatumio/tatum';

import {
  BlockHeaderResponse,
  BlockResponse,
  ContractResponse,
  PreapplyResponse,
  // RpcClient
} from '@taquito/rpc';

export abstract class TezosService {
  protected constructor(protected readonly logger: PinoLogger) { }

  protected abstract getRpcClient(): Promise<string>;

  protected abstract getNodesUrl(): Promise<string>;

  public async getBlockChainInfo(): Promise<BlockHeaderResponse> {
    const url = await this.getNodesUrl();
    const [block] = (await axios.get(`${url}/blocks?limit=1&offset=0`)).data;
    return block;
  }

  public async getBlock(hash: string): Promise<BlockResponse> {
    const url = await this.getNodesUrl();
    const [block] = (await axios.get(`${url}/operations?limit=1&block_id=${hash}&operation_kind=transaction&offset=0`)).data;
    return block;
  }

  public async getAccount(address: string): Promise<ContractResponse> {
    const url = await this.getNodesUrl();
    const account = (await axios.get(`${url}/accounts/${address}?account=${address}&limit=1&offset=0`)).data;
    return account;
  }

  public async getTransactionsByAccount(
    address: string,
    limit: number,
    offset: number
  ): Promise<PreapplyResponse[]> {
    const url = await this.getNodesUrl();
    const transactions = (await axios.get(`${url}/operations?limit=${limit}&account_id=${address}&operation_kind=transaction&offset=${offset}`)).data;
    return transactions;
  }

  public async getTransaction(hash: string): Promise<PreapplyResponse> {
    const url = await this.getNodesUrl();
    const transaction = (await axios.get(`${url}/operations?limit=1&operation_id=${hash}&offset=0`)).data;
    return transaction[0];
  }

  public async generateWallet(mnem?: string): Promise<Wallet> {
    return generateXtzWallet(mnem);
  }

  public async generateAddress(
    xpub: string,
    i: number,
  ): Promise<{ address: string }> {
    const address = await generateAddressFromXPub(
      Currency.XTZ,
      true,
      xpub,
      i,
    );
    return { address };
  }

  public async generatePrivateKey(
    mnemonic: string,
    i: number,
  ): Promise<{ key: string }> {
    const key = await generatePrivateKeyFromMnemonic(
      Currency.XTZ,
      true,
      mnemonic,
      i,
    );
    return { key };
  }

  public async broadcast(
    txData: string,
    providerUrl?: string
  ): Promise<{ txId: string }> {
    const txId = await broadcastXtzTransaction(txData, providerUrl);
    return { txId };
  }

  public async sendTransaction(
    body: TransferXtz,
    providerUrl?: string
  ): Promise<{ txId: string }> {
    const txId = await sendXtzTransaction(body, providerUrl);
    return { txId };
  }

}
