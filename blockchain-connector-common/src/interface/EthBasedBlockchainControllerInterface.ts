import {
  EthBasedEstimateGas,
  GeneratePrivateKey,
  Pagination,
  PathAddress,
  PathHash,
  PathXpub,
  QueryMnemonic,
  TransactionKMSResponse,
  TransactionResponse,
  TxData,
} from '../index';
import {
  EstimateGasEth,
  SmartContractMethodInvocation,
  SmartContractReadMethodInvocation,
  TransferErc20,
} from '@tatumio/tatum';

export interface EthBasedBlockchainControllerInterface {

  /**
   * Returns current info about blockchain.
   */
  getInfo(): Promise<any>

  /**
   * Generate wallet via tatum-js lib.
   * @param mnemonic
   */
  generateWallet(mnemonic: QueryMnemonic): Promise<any>

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
  getBlock(path: PathHash): Promise<any>

  /**
   * Returns transaction by hash.
   *
   * @param path
   */
  getTransaction(path: PathHash): Promise<any>

  /**
   * Returns transactions by address.
   *
   * @param path
   * @param query
   */
  getTransactionsByAccount?(path: PathAddress, query: Pagination): Promise<any>

  /**
   * Sends transaction to the blockchain. Signing of transaction is done via tatum-js lib.
   */
  sendTransaction(body: TransferErc20): Promise<TransactionResponse | TransactionKMSResponse>

  /**
   * Broadcasts signed transaction to the blockchain.
   *
   * @param txData
   */
  broadcast(txData: TxData): Promise<TransactionResponse>

  estimateGas(estimateGasEth: EstimateGasEth): Promise<EthBasedEstimateGas>

  countTransactions(param: PathAddress)

  invokeSmartContractMethod(smartContractMethodInvocation: SmartContractMethodInvocation | SmartContractReadMethodInvocation)

  /**
   * Returns account by address.
   *
   * @param path
   */
  getAccount?(path: PathAddress): Promise<any>

  /**
   * Set web3 driver.
   */
  web3Driver(body: any): Promise<any>
}
