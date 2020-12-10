const ScryptaCore = require('@scrypta/core');
import { LYRA_NETWORK, LYRA_TEST_NETWORK, ScryptaBlock, ScryptaTx, ScryptaUnspent } from './constants';
import { TatumError } from './error'
import { PinoLogger } from 'nestjs-pino';
import * as Tatum from '@tatumio/tatum'

export class ScryptaBlockchainService {
  protected scrypta: any;
  protected testnet: boolean;
  protected currency: 'LYRA';
  protected readonly logger: PinoLogger;

  constructor(testnet = false, nodes?: Array<string>, debug?: boolean) {
    this.scrypta = new ScryptaCore;
    this.testnet = testnet;
    this.scrypta.staticnodes = true;
    if (this.testnet === true) {
      this.scrypta.testnet = true;
    }
    if(nodes !== undefined && nodes.length > 0){
      this.scrypta.mainnetIdaNodes = nodes;
      this.scrypta.testnetIdaNodes = nodes;
    }
    if(debug === true){
      this.scrypta.debug = true;
    }
  }

  //
  //  GENERIC FUNCTIONS
  //

  public getNetwork() {
    return this.testnet ? LYRA_TEST_NETWORK : LYRA_NETWORK;
  }

  //
  // BLOCKCHAIN FUNCTIONS
  //

  /**
   * Get blcokchain informations
   * @param testnet 
   */
  public async getBlockChainInfo(testnet?: boolean): Promise<any> {

    if (testnet) {
      this.scrypta.testnet = testnet;
    }

    try {
      let info = await this.scrypta.get('/wallet/getinfo')
      return info;
    } catch (e) {
      this.logger.error(e);
      throw new TatumError(`${e.message} Code: ${e.code}`, `blockchain.error.code`);
    }
  }

  /**
   * Get current block height
   * @param testnet 
   */
  public getCurrentBlock(testnet?: boolean): Promise<number> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }

      try {
        let info = await this.scrypta.get('/wallet/getinfo')
        response(info.blocks);
      } catch (e) {
        this.logger.error(e);
        throw new TatumError(`${e.message}`, `blockchain.error.code`);
      }
    })
  }

  /**
   * Get Block hash from index
   * @param i
   * @param testnet 
   */
  public getBlockHash(i: number, testnet?: boolean): Promise<string> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let block = await this.scrypta.get('/blockhash/' + i)
        response(block.hash)
      } catch (e) {
        this.logger.error(e);
        throw new TatumError(`${e.message}`, `blockchain.error.code`);
      }
    })
  }

  /**
   * Get block details by hash
   * @param hash 
   * @param testnet 
   */
  public getBlock(hash: string, testnet?: boolean): Promise<ScryptaBlock> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let block = await this.scrypta.get('/rawblock/' + hash)
        response({
          hash: block.hash,
          height: block.height,
          confirmations: block.confirmations,
          time: block.time,
          txs: block.txs
        })
      } catch (e) {
        this.logger.error(e);
        throw new TatumError(`${e.message}`, `blockchain.error.code`);
      }
    })
  }

  //
  // ADDRESSES FUNCTIONS
  //

  /**
   * Generate new address from xpub
   * @param xpub 
   * @param derivationIndex 
   */
  public async generateAddress(xpub: string, derivationIndex: number, testnet?: boolean) {
    if (testnet) {
      this.scrypta.testnet = testnet;
    } else {
      testnet = this.testnet;
    }
    try {
      let address = await Tatum.generateAddressFromXPub(Tatum.Currency[this.currency], testnet, xpub, derivationIndex)
      return address
    } catch (e) {
      this.logger.error(e);
      throw new TatumError('Unable to generate address, wrong xpub and account type.', 'address.generation.failed.wrong.xpub');
    }
  }

  public async generateWallet(mnem?: string, testnet?: boolean) {
    if (testnet) {
      this.scrypta.testnet = testnet;
    } else {
      testnet = this.testnet;
    }
    const lyraWallet = await Tatum.generateWallet(Tatum.Currency[this.currency], testnet, mnem);
    return lyraWallet
  }

  public async generateAddressPrivateKey(derivationIndex: number, mnemonic: string, testnet?: boolean): Promise<{ key: string }> {
    if (testnet) {
      this.scrypta.testnet = testnet;
    } else {
      testnet = this.testnet;
    }
    try {
      let privateKey = await Tatum.generatePrivateKeyFromMnemonic(Tatum.Currency[this.currency], testnet, mnemonic, derivationIndex);
      return { key: privateKey }
    } catch (e) {
      this.logger.error(e);
      throw new TatumError('Unable to generate address, wrong mnemonic and index.', 'key.generation.failed.wrong.mnemonic');
    }
  }

  //
  //  TRANSACTIONS FUNCTIONS
  //

  /**
   * Get all transactions by address
   * @param address 
   * @param pagination 
   */
  public async getTransactionsByAddress(address: string, pagination?: object, testnet?: boolean):
    Promise<Array<ScryptaTx>> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let transactions = await this.scrypta.get('/transactions/' + address)
        response(transactions.data)
      } catch (e) {
        this.logger.error(e);
        throw new TatumError(`${e.message}`, `blockchain.error.code`);
      }
    })
  }

  /**
   * List all unspent by address
   * @param address
   * @param pagination 
   * @param testnet 
   */
  public async getUnspentsByAddress(address: string, pagination?: object, testnet?: boolean):
    Promise<Array<ScryptaUnspent>> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let unspent = await this.scrypta.get('/unspent/' + address)
        let parsed = []
        for (let k in unspent.unspent) {
          let utxo = unspent.unspent[k]
          parsed.push({
            txid: utxo.txid,
            vout: utxo.vout,
            amount: utxo.amount,
            scriptPubKey: utxo.scriptPubKey,
            block: utxo.block
          })
        }
        response(parsed)
      } catch (e) {
        this.logger.error(e);
        throw new TatumError(`${e.message}`, `blockchain.error.code`);
      }
    })
  }

  /**
   * Get single UTXO by hash and index
   * @param hash
   * @param index 
   */
  public async getUTXO(hash: string, index: number, testnet?: boolean): Promise<ScryptaTx> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let unspent = await this.scrypta.get('/utxo/' + hash + '/' + index)
        if (unspent === false) {
          throw new TatumError('No such UTXO for transaction and index.', 'tx.hash.index.spent');
        }
        response(unspent);
      } catch (e) {
        this.logger.error(e);
        throw new TatumError('No such UTXO for transaction and index.', 'tx.hash.index.spent');
      }
    })
  }

  /**
   * Get raw transaction by txHash
   * @param txHash
   * @param testnet 
   */
  public async getRawTransaction(txHash: string, testnet?: boolean): Promise<any> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let rawtx = await this.scrypta.get('/rawtransaction/' + txHash)
        if (rawtx === false) {
          throw new TatumError('No such transaction.', 'tx.hash');
        }
        response(rawtx)
      } catch (e) {
        this.logger.error(e);
        throw new TatumError('No such transaction.', 'tx.hash');
      }
    })
  }

  /**
   * Broadcast a signed transactions to the network
   * @param txData 
   * @param testnet 
   */
  public async broadcast(txData: string, testnet?: boolean): Promise<{ txId: string, failed?: boolean }> {
    return new Promise(async response => {
      if (testnet) {
        this.scrypta.testnet = testnet;
      } else {
        testnet = this.testnet;
      }
      try {
        let sendrawtransaction = await this.scrypta.post('/sendrawtransaction', { rawtransaction: txData })
        if (sendrawtransaction.data === null) {
          throw new TatumError('Transaction not accepted by network.', 'tx.broadcast');
        } else {
          let txid = <string>sendrawtransaction['data']
          response({ txId: txid, failed: false })
        }
      } catch (e) {
        this.logger.error(e);
        throw new TatumError('Can\'t send transaction.', 'tx.broadcast');
      }

    })
  }

}