import { Block, PaymentAddress, Transaction } from '@cardano-graphql/client-ts';
import {
  AdaUtxo,
  Currency, FromAddress, FromUTXO,
  generateAddressFromXPub,
  generatePrivateKeyFromMnemonic,
  generateWallet, To,
  TransferBtcBasedBlockchain,
} from '@tatumio/tatum';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { AdaBlockchainInfo } from './constants';
import {
  Address,
  BigNum, Bip32PrivateKey, hash_transaction,
  LinearFee, make_vkey_witness, TransactionBody,
  TransactionBuilder, TransactionHash, Transaction as AdaTransaction,
  TransactionInput, TransactionOutput, TransactionWitnessSet, Value, Vkeywitnesses,
} from '@emurgo/cardano-serialization-lib-nodejs'
import BigNumber from 'bignumber.js'
import { AdaError } from './AdaError'

const TX_FIELDS = '{block{number} includedAt fee hash inputs {address sourceTxHash sourceTxIndex txHash value} outputs {address index txHash value}}';

export abstract class AdaService {
  protected constructor(protected readonly logger: PinoLogger) {}

  protected abstract isTestnet(): Promise<boolean>;

  protected abstract getNodesUrl(): Promise<string[]>;

  public async getGraphQLEndpoint(): Promise<string> {
    const [url] = await this.getNodesUrl()
    return `${url}/graphql`;
  }

  async generateWallet(mnemonic?: string) {
    return generateWallet(Currency.ADA, await this.isTestnet(), mnemonic);
  }

  async generateAddress(
    xpub: string,
    i: number,
  ): Promise<{ address: string }> {
    const testnet = await this.isTestnet();
    const address = await generateAddressFromXPub(
      Currency.ADA,
      testnet,
      xpub,
      i,
    );
    return { address };
  }

  async generatePrivateKey(
    mnemonic: string,
    i: number,
  ): Promise<{ key: string }> {
    const testnet = await this.isTestnet();
    const key = await generatePrivateKeyFromMnemonic(
      Currency.ADA,
      testnet,
      mnemonic,
      i,
    );
    return { key };
  }

  public async getBlockChainInfo(): Promise<AdaBlockchainInfo> {
    const [testnet, graphQLUrl] = await Promise.all([
      this.isTestnet(),
      this.getGraphQLEndpoint(),
    ]);
    const { tip } = (
      await axios.post(graphQLUrl, {
        query: '{ cardano { tip { number slotNo epoch { number } }} }',
      })
    ).data.data.cardano;
    return {
      testnet,
      tip,
    };
  }


  public async getBlock(hash: string): Promise<Block> {
    const graphQLUrl = await this.getGraphQLEndpoint();
    const [block] = (
      await axios.post(graphQLUrl, {
        query: `{ blocks (where: { hash: { _eq: "${hash}" } }) {
          fees
          slotLeader { description, hash }
          forgedAt
          merkleRoot
          number
          opCert
          slotInEpoch
          slotNo
          protocolVersion
          size
          transactionsCount
          transactions { hash }
          nextBlock { hash, number }
          previousBlock { hash, number  }
          vrfKey
        } }`,
      })
    ).data.data.blocks;
    return block;
  }

  public async getTransaction(hash: string): Promise<Transaction> {
    const graphQLUrl = await this.getGraphQLEndpoint();
    const [transaction] = (
      await axios.post(graphQLUrl, {
        query: `{ transactions (where: { hash: { _eq: "${hash}" } }) {
          block { hash number }
          blockIndex
          deposit
          fee
          inputs { address sourceTxHash sourceTxIndex }
          inputs_aggregate { aggregate { count } }
          outputs { address index txHash value }
          outputs_aggregate { aggregate { count }}
          invalidBefore
          invalidHereafter
          size
          totalOutput
          includedAt
          withdrawals { address amount transaction { hash }}
          withdrawals_aggregate { aggregate { count } }
        } }`,
      })
    ).data.data.transactions;
    return transaction;
  }

  public async getAccount(address: string): Promise<PaymentAddress> {
    const graphQLUrl = await this.getGraphQLEndpoint();
    const [account] = (
      await axios.post(graphQLUrl, {
        query: `{ paymentAddresses (addresses: "${address}") {
          summary {
            utxosCount
            assetBalances {
              asset { assetId assetName name description logo metadataHash url }
              quantity
            }
          }
        } }`,
      })
    ).data.data.paymentAddresses;
    return account;
  }

  public async getTransactionsByAccount(
    address: string,
    pageSize: string,
    offset: string,
  ): Promise<Transaction[]> {
    const graphQLUrl = await this.getGraphQLEndpoint();
    const limit = pageSize && !isNaN(Number(pageSize)) ? Number(pageSize) : 0
    const offsetTransaction = offset && !isNaN(Number(offset)) ? Number(offset) : 0
    const { transactions } = (
      await axios.post(graphQLUrl, {
        query: `{ transactions (
          limit: ${limit}
          offset: ${offsetTransaction}
          where: {
            _or: [
              { inputs: { address: { _eq: "${address}" } } }
              { outputs: { address: { _eq: "${address}" } } }
            ]
          }) {
            block { hash number }
            blockIndex
            deposit
            fee
            inputs { address sourceTxHash sourceTxIndex }
            inputs_aggregate { aggregate { count } }
            outputs { address index txHash value }
            outputs_aggregate { aggregate { count }}
            invalidBefore
            invalidHereafter
            size
            totalOutput
            includedAt
            withdrawals { address amount transaction { hash }}
            withdrawals_aggregate { aggregate { count } }
          }
        }`,
      })
    ).data.data;
    return transactions;
  }



  public async broadcast(
    txData: string,
  ): Promise<{ txId: string }> {
    const graphQLUrl = await this.getGraphQLEndpoint();
    const txId = (await axios.post(graphQLUrl, {
      query: `mutation {
        submitTransaction(transaction: "${txData}") {
          hash
        }
      }`,
    })).data.data.submitTransaction.hash;
    return { txId };
  }

  public async getUtxosByAddress(
    address: string,
  ): Promise<AdaUtxo[]> {
    const graphQLUrl = await this.getGraphQLEndpoint();
    const utxos = (await axios.post(graphQLUrl, {
      query: `{ utxos (where: {
        address: {
          _eq: "${address}"
        }
      }) {
        txHash
        index
        value
      }
    }`,
    })).data.data.utxos;
    return utxos;
  }

  public async sendTransaction(
    body: TransferBtcBasedBlockchain,
  ): Promise<{ txId: string }> {
    const txData = await this.prepareAdaTransaction(body);
    return await this.broadcast(txData)
  }

  public async getTransactionsFromBlockTillNow(blockNumber: number): Promise<Transaction[]> {
    try {
      const graphQLUrl = await this.getGraphQLEndpoint();
      const query = `{transactions(where:{block:{number:{_gte:${blockNumber}}}})${TX_FIELDS}}`;
      const { data } = (await axios.post(graphQLUrl, { query })).data;
      return (data?.transactions || []).map((t: any) => {
        t.block = t.block.number;
        delete t.block.number;
        return t;
      });
    } catch (e) {
      this.logger.error(e.response);
      throw new AdaError('Unable to find transaction.', 'tx.not.found');
    }
  }

  private async prepareAdaTransaction(transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const txBuilder = await this.initTransactionBuilder()
    const { to } = transferBtcBasedBlockchain
    const { privateKeysToSign, amount: fromAmount } = await this.addInputs(txBuilder, transferBtcBasedBlockchain)
    const toAmount = this.addOutputs(txBuilder, to)
    await this.processFeeAndRest(txBuilder, fromAmount, toAmount, transferBtcBasedBlockchain)
    return this.signTransaction(txBuilder, transferBtcBasedBlockchain, privateKeysToSign)
  }

  private async initTransactionBuilder() {
    const txBuilder = TransactionBuilder.new(
      LinearFee.new(
        BigNum.from_str('44'),
        BigNum.from_str('155381'),
      ),
      BigNum.from_str('1000000'),
      BigNum.from_str('500000000'),
      BigNum.from_str('2000000'),
    );
    const { tip: { slotNo } } = await this.getBlockChainInfo();
    txBuilder.set_ttl(slotNo + 200);
    return txBuilder
  }

  private async processFeeAndRest(transactionBuilder: TransactionBuilder, fromAmount: BigNumber, toAmount: BigNumber,
                                          transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const { fromAddress, fromUTXO } = transferBtcBasedBlockchain
    if (fromAddress) {
      this.addFeeAndRest(transactionBuilder, fromAddress[0].address, fromAmount, toAmount)
    } else if (fromUTXO) {
      const txHash = fromUTXO[0].txHash
      const transaction = await this.getTransaction(txHash)
      const output = transaction.outputs.find(output => output.index === fromUTXO[0].index)
      if (output) {
        this.addFeeAndRest(transactionBuilder, output.address, fromAmount, toAmount)
      }
    } else {
      throw new Error('Field fromAddress or fromUTXO is not filled.')
    }
  }

  private async addInputs(transactionBuilder: TransactionBuilder, transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const { fromUTXO, fromAddress } = transferBtcBasedBlockchain
    if (fromAddress) {
      return this.addAddressInputs(transactionBuilder, fromAddress)
    }
    if (fromUTXO) {
      return this.addUtxoInputs(transactionBuilder, fromUTXO)
    }
    throw new Error('Field fromAddress or fromUTXO is not filled.')
  }

  private async addAddressInputs(transactionBuilder: TransactionBuilder, fromAddresses: FromAddress[]) {
    let amount = new BigNumber(0)
    const privateKeysToSign: string[] = [];
    for (const fromAddress of fromAddresses) {
      const { address, privateKey } = fromAddress
      const utxos: AdaUtxo[] = await this.getUtxosByAddress(address)
      for (const utxo of utxos) {
        amount = amount.plus(utxo.value);
        this.addInput(transactionBuilder, privateKey, utxo, address)
        privateKeysToSign.push(fromAddress.signatureId || fromAddress.privateKey)
      }
    }
    return { amount, privateKeysToSign }
  }

private async addUtxoInputs (transactionBuilder: TransactionBuilder, fromUTXOs: FromUTXO[]) {
    let amount = new BigNumber(0)
    const privateKeysToSign: string[] = [];
    for (const utxo of fromUTXOs) {
      const transaction = await this.getTransaction(utxo.txHash)
      const output = transaction.outputs.find(output => output.index === utxo.index)
      if (output) {
        const value = output.value;
        amount = amount.plus(value);
        await this.addInput(transactionBuilder, utxo.privateKey, { value, ...utxo }, output.address)
        privateKeysToSign.push(utxo.signatureId || utxo.privateKey)
      }
    }
    return { amount, privateKeysToSign }
  }

  private addInput(transactionBuilder: TransactionBuilder, privateKey: string, utxo: AdaUtxo, address: string) {
    transactionBuilder.add_input(
      Address.from_bech32(address),
      TransactionInput.new(
        TransactionHash.from_bytes(Buffer.from(utxo.txHash, 'hex')),
        utxo.index,
      ),
      Value.new(BigNum.from_str(utxo.value)),
    )
  }

  private addFeeAndRest = (transactionBuilder: TransactionBuilder, address: string, fromAmount: BigNumber, toAmount: BigNumber) => {
    const fromRest = Address.from_bech32(address);
    const tmpOutput = TransactionOutput.new(
      fromRest,
      Value.new(BigNum.from_str(String('1000000'))),
    );
    const fee = parseInt(transactionBuilder.min_fee().to_str()) + parseInt(transactionBuilder.fee_for_output(tmpOutput).to_str());
    this.addOutput(transactionBuilder, address, fromAmount.minus(toAmount).minus(fee).toString())
    transactionBuilder.set_fee(BigNum.from_str(String(fee)));
  }

  private addOutput = (transactionBuilder: TransactionBuilder, address: string, amount: string) => {
    transactionBuilder.add_output(TransactionOutput.new(
      Address.from_bech32(address),
      Value.new(BigNum.from_str(amount)),
    ));
  }

  private signTransaction(transactionBuilder: TransactionBuilder, transferBtcBasedBlockchain: TransferBtcBasedBlockchain, privateKeysToSign: string[]) {
    const txBody = transactionBuilder.build();
    const { fromAddress, fromUTXO } = transferBtcBasedBlockchain

    if ((fromAddress && fromAddress[0].signatureId) || (fromUTXO && fromUTXO[0].signatureId)) {
      return JSON.stringify({ txData: JSON.stringify(txBody.to_bytes()), privateKeysToSign });
    }

    const witnesses = this.createWitnesses(txBody, transferBtcBasedBlockchain)

    return Buffer.from(
      AdaTransaction.new(txBody, witnesses).to_bytes(),
    ).toString('hex')
  }

  private createWitnesses(transactionBody: TransactionBody, transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const { fromAddress, fromUTXO } = transferBtcBasedBlockchain
    const txHash = hash_transaction(transactionBody);
    const vKeyWitnesses = Vkeywitnesses.new();
    if (fromAddress) {
      for (const address of fromAddress) {
        this.makeWitness(address.privateKey, txHash, vKeyWitnesses)
      }
    } else if (fromUTXO) {
      for (const utxo of fromUTXO) {
        this.makeWitness(utxo.privateKey, txHash, vKeyWitnesses)
      }
    } else {
      throw new Error('No private key for witness found.')
    }
    const witnesses = TransactionWitnessSet.new();
    witnesses.set_vkeys(vKeyWitnesses);
    return witnesses
  }

   private makeWitness (privateKey: string, txHash: TransactionHash, vKeyWitnesses: Vkeywitnesses) {
    const privateKeyCardano = Bip32PrivateKey.from_128_xprv(
      Buffer.from(privateKey, 'hex'),
    ).to_raw_key();
    vKeyWitnesses.add(make_vkey_witness(txHash, privateKeyCardano));
  }

  private addOutputs(transactionBuilder: TransactionBuilder, tos: To[]) {
    let amount = new BigNumber(0)
    for (const to of tos) {
      const value = new BigNumber(1000000).times(to.value)
      amount = value.plus(amount)
      this.addOutput(transactionBuilder, to.address, value.toString())
    }
    return amount
  }
}

