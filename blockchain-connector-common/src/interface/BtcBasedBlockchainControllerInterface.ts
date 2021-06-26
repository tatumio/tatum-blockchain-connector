import {
  BlockchainError,
  GeneratePrivateKey,
  Pagination,
  PathAddress,
  PathHash,
  PathXpub,
  QueryMnemonic, TransactionKMSResponse,
  TransactionResponse,
  TxData,
} from '../index'
import { TransferBtcBasedBlockchain } from '@tatumio/tatum'

export interface BtcBasedBlockchainControllerInterface {

  /**
   * Returns current info about blockchain.
   */
  getInfo(): Promise<object>

  /**
   * Generate wallet via tatum-js lib.
   * @param mnemonic
   */
  generateWallet(mnemonic: QueryMnemonic): Promise<object>

  /**
   * Generate address via tatum-js lib.
   *
   * @param xpub
   * @param i
   */
  generateAddress({ xpub, i }: PathXpub): Promise<{ address: string }>

  /**
   * Generate private key via tatum-js lib.
   *
   * @param generatePrivateKey
   */
  generatePrivateKey(generatePrivateKey: GeneratePrivateKey): Promise<{ key: string }>

  /**
   * Returns selected block by hash.
   *
   * @param path
   */
  getBlock(path: PathHash): Promise<object>

  /**
   * Returns transaction by hash.
   *
   * @param path
   */
  getTransaction(path: PathHash): Promise<object>

  /**
   * Returns transactions by address.
   *
   * @param path
   * @param query
   */
  getTransactionsByAccount(path: PathAddress, query: Pagination): Promise<object>

  /**
   * Sends transaction to the blockchain. Signing of transaction is done via tatum-js lib.
   *
   * @param transferBtcBasedBlockchain
   */
  sendTransaction(transferBtcBasedBlockchain: TransferBtcBasedBlockchain): Promise<TransactionResponse | TransactionKMSResponse>

  /**
   * Broadcasts signed transaction to the blockchain.
   *
   * @param txData
   */
  broadcast(txData: TxData): Promise<TransactionResponse>

  /**
   * Each endpoint is wrapped inside try catch with the error rethrow.
   *
   * @param e
   */
  throwError(e: BlockchainError): void

  /**
   * Returns UTXOs by address.
   *
   * @param path
   */
  getUTxosByAddress?(path: PathAddress): Promise<object>

  /**
   * Returns account by address.
   *
   * @param path
   */
  getAccount?(path: PathAddress): Promise<object>
}