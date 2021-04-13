import { Block } from '@cardano-graphql/client-ts';

export type CardanoBlockchainInfo = {
  testnet: boolean;
  tip: Block;
};
