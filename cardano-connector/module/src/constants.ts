import { Block, Transaction } from '@cardano-graphql/client-ts';

export type CardanoBlockchainInfo = {
  testnet: boolean;
  tip: Block;
};

export type WalletId = string;

export type CardanoBlockInfo = {
  testnet: boolean;
  block: Block;
};

export type CardanoTransactionInfo = {
  testnet: boolean;
  transaction: Transaction;
};
