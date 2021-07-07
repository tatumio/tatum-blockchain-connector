import { Currency } from '@tatumio/tatum';
export class QtumIRawTransactionInfo {
    txid: string
    version: number
    locktime: number
    receipt: QtumITransactionReceipt[]
    vin: IInput[]
    vout: IOutput[]
    confirmations: number
    time: number
    valueOut: number
    valueIn: number
    fees: number
    blockhash: string
    blockheight: number
    isqrc20Transfer: boolean
  }
  export interface QtumIRawTransactions {
    pagesTotal: number
    txs: QtumIRawTransactionInfo[]
  }
  export interface QtumITransactionReceipt {
      blockHash: string
      blockNumber: number
      transactionHash: string
      transactionIndex: number
      from: string
      to: string
      cumulativeGasUsed: string
      gasUsed: number
      contractAddress: string
      excepted: string
      log: any[]
    }
    export interface QtumIGetInfo {
      addrStr: string
  
      /**
       * balance of address in qtum
       */
      balance: number
  
      /**
       * Balance of address in satoshi
       */
      balanceSat: number
  
      totalReceived: number
      totalReceivedSat: number
      totalSet: number
      totalSentSat: number
  
      unconfirmedBalance: number
      unconfirmedBalanceSat: number
  
      unconfirmedTxApperances: number
      txApperances: number
  
      /**
       * List of transaction IDs
       */
      transactions: string[]
    }
  
    export interface QtumIContractCall {
      address: string
      executionResult: any
    }
    export interface QtumITransactionReceipt {
      blockHash: string
      blockNumber: number
      transactionHash: string
      transactionIndex: number
      from: string
      to: string
      cumulativeGasUsed: string
      gasUsed: number
      contractAddress: string
      excepted: string
      log: any[]
    }
    export interface QtumIExecutionResult {
      gasUsed: number
      excepted: string
      newAddress: string
      output: string
      codeDeposit: number
      gasRefunded: number
      depositSize: number
      gasForDeposit: number
    }
    export interface QtumRUTXO {
      address: string
      txid: string
      hash: string // txid
  
      pos: number // vout (insight)
      /**
       * Public key that controls this UXTO, as hex string.
       */
      scriptPubKey: string
  
      amount: number
      value: number // satoshi (insight)
  
      isStake: boolean
      confirmations: number
    }
    export interface QtumIUTXO {
      address: string
      txid: string
      vout: number
  
      /**
       * Public key that controls this UXTO, as hex string.
       */
      scriptPubKey: string
  
      amount: number
      satoshis: number
  
      isStake: boolean
      height: number
      confirmations: number
    }
    export interface QtumISendRawTxResult {
      txid: string
    }
    export interface IOutput {
      value: string
  
      address?: string
      script?: Buffer
      scriptPubKey:{
        hex: string,
        asm: string,
        addresses: string[],
        type: string
      }
    }
  
    export interface IInput {
      value: number
  
      script?: Buffer
    }
    export interface RawTx {
      testnet:boolean
      rawtx:string
    }
    export interface contractCall{
      testnet: boolean
      address: string
      encodedData: string
    }