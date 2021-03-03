import { Block, Transaction } from '@cardano-graphql/client-ts';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { CardanoBlockchainInfo, WalletId, CardanoBlockInfo, CardanoTransactionInfo } from './constants';
import { GenerateWalletMnemonic } from './dto/GenerateWalletMnemonic';

export abstract class CardanoService {
  protected constructor(protected readonly logger: PinoLogger) { }

  protected abstract isTestnet(): Promise<boolean>;

  protected abstract getNodesUrl(): Promise<string[]>;

  protected abstract getCardanoGraphQLPort(): Promise<number>;

  protected abstract getCardanoWalletPort(): Promise<number>;

  protected abstract getCardanoWalletUrls(): Promise<string[]>;

  public async getBlockChainInfo(): Promise<CardanoBlockchainInfo> {
    const testnet = await this.isTestnet();
    const [url] = await this.getNodesUrl();
    const port = await this.getCardanoGraphQLPort();
    const { tip } = (
      await axios.post(`${url}:${port}/graphql`, {
        query: '{ cardano { tip { number slotNo epoch { number } }} }',
      })
    ).data.data.cardano;
    return {
      testnet,
      tip,
    };
  }

  public async generateWallet(req: GenerateWalletMnemonic): Promise<WalletId> {
    const [url] = await this.getNodesUrl();
    const port = await this.getCardanoWalletPort();
    return (await axios.post(`${url}:${port}/v2/wallets`, req)).data.id;
  }

  public async getBlockInfoByHash(hash: string): Promise<CardanoBlockInfo> {
    const testnet = await this.isTestnet();
    const [url] = await this.getNodesUrl();
    const port = await this.getCardanoGraphQLPort();
    const [block] = (
      await axios.post(`${url}:${port}/graphql`, {
        query: `{ blocks (where: { hash: { _eq: "${hash}" } }) {
          epoch { nonce number }
          epochNo
          fees
          slotLeader { description, hash }
          forgedAt
          merkelRoot
          number
          opCert
          slotInEpoch
          slotNo
          protocolVersion
          size
          transactionsCount
          transactions_aggregate { aggregate { avg { deposit fee mint { quantity } size totalOutput  } count }}
          transactions { hash }
          nextBlock { hash, number }
          previousBlock { hash, number  }
          vrfKey
        } }`,
      })
    ).data.data.blocks;
    return {
      testnet,
      block,
    }
  }

  public async getTransactionInfoByHash(hash: string): Promise<CardanoTransactionInfo> {
    const testnet = await this.isTestnet();
    const [url] = await this.getNodesUrl();
    const port = await this.getCardanoGraphQLPort();
    const [transaction] = (
      await axios.post(`${url}:${port}/graphql`, {
        query: `{ transactions (where: { hash: { _eq: "${hash}" } }) {
          block { hash number }
          blockIndex
          deposit
          fee
          inputs { address sourceTxHash sourceTxIndex }
          inputs_aggregate { aggregate { avg { tokens { quantity } } count  } }
          mint_aggregate { aggregate { avg { quantity }} nodes { assetId assetName policyId quantity transactionOutput { address index txHash }}}
          outputs { address index transaction { hash } txHash tokens { assetId assetName policyId quantity transactionOutput { txHash }} value}
          outputs_aggregate { aggregate { avg { tokens { quantity } value }}}
          invalidBefore
          invalidHereafter
          mint { assetId assetName policyId quantity transactionOutput { address index txHash }}
          size
          totalOutput
          includedAt
          withdrawals { address amount transaction { hash }}
          withdrawals_aggregate { aggregate { count } }
        } }`,
      })
    ).data.data.transactions;
    return {
      testnet,
      transaction,
    }
  }
}
