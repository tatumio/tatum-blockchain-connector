import { Block } from '@cardano-graphql/client-ts';

export type AdaBlockchainInfo = {
  testnet: boolean;
  tip: Block;
};
