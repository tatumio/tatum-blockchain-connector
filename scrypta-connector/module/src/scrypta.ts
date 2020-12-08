const ScryptaCore = require('@scrypta/core');
import { LYRA_NETWORK, LYRA_TEST_NETWORK, LYRA_DERIVATION_PATH, ScryptaBlock, ScryptaTx, ScryptaUnspent } from './constants';
import { TatumError } from './error'
import { fromBase58, fromSeed } from 'bip32';
import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { ECPair, networks, payments, TransactionBuilder } from 'bitcoinjs-lib';
import { PinoLogger } from 'nestjs-pino';
import hdkey from 'hdkey';
import { response } from 'express';

export abstract class ScryptaBlockchainService {
  protected scrypta: any;
  protected testnet: boolean;
  protected currency: 'LYRA';
  protected readonly logger: PinoLogger;

  constructor(testnet = false) {
    this.scrypta = new ScryptaCore;
    this.testnet = testnet;
    if (this.testnet === true) {
      this.scrypta.testnet = true;
    }
  }

  //
  //  GENERIC FUNCTIONS
  //

  public getNetwork() {
    return this.testnet ? LYRA_TEST_NETWORK : LYRA_NETWORK;
  }

  private getDerivationPath() {
    return LYRA_DERIVATION_PATH
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
  public async generateAddress(xpub: string, derivationIndex: number) {
    try {
      const w = fromBase58(xpub, this.getNetwork()).derivePath(String(derivationIndex));
      const address = payments.p2pkh({ pubkey: w.publicKey, network: this.getNetwork() }).address;
      if (address !== undefined) {
        return { address };
      }
    } catch (e) {
      this.logger.error(e);
      throw new TatumError('Unable to generate address, wrong xpub and account type.', 'address.generation.failed.wrong.xpub');
    }
    throw new TatumError('Unable to generate address', 'address.generation.failed');
  }

  public async generateWallet(mnem?: string) {
    const mnemonic = mnem ? mnem : generateMnemonic(256);
    const hdwallet = hdkey.fromMasterSeed(mnemonicToSeed(mnemonic), this.getNetwork().bip32);
    return { mnemonic, xpub: hdwallet.derive(this.getDerivationPath()).toJSON().xpub };
  }

  public async generateAddressPrivateKey(derivationIndex: number, mnemonic: string): Promise<{ key: string }> {
    try {
      const w = fromSeed(await mnemonicToSeed(mnemonic), this.getNetwork())
        .derivePath(this.getDerivationPath())
        .derive(derivationIndex);
      return { key: w.toWIF() };
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
      }
      try {
        let unspent = await this.scrypta.get('/utxo/' + hash + '/' + index)
        if (unspent === false) {
          throw new TatumError('No such UTXO for transaction and index.', 'tx.hash.index.spent');
        }
        response(unspent);
      } catch (e) {
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
      }
      try {
        let rawtx = await this.scrypta.get('/rawtransaction/' + txHash)
        if (rawtx === false) {
          throw new TatumError('No such transaction.', 'tx.hash');
        }
        response(rawtx)
      } catch (e) {
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
      }
      try {
        let sendrawtransaction = await this.scrypta.post('/sendrawtransaction', { rawtransaction: txData })
        if (sendrawtransaction.data === null) {
          throw new TatumError('Can\'t send transaction.', 'tx.broadcast');
        } else {
          let txid = <string>sendrawtransaction['data']
          response({ txId: txid, failed: false })
        }
      } catch (e) {
        throw new TatumError('Can\'t send transaction.', 'tx.broadcast');
      }

    })
  }

}