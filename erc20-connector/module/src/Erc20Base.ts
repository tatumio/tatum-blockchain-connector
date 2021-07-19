import {IsIn, IsNotEmpty} from 'class-validator';

import {
  BurnCeloErc20,
  BurnErc20,
  Currency,
  DeployCeloErc20,
  DeployErc20,
  MintCeloErc20,
  MintErc20, OneTransfer20,
  TransferBscBep20,
  TransferCeloOrCeloErc20Token, TransferCustomErc20,
  TransferErc20,
  TransferEthErc20,
} from '@tatumio/tatum';

export class ChainBurnErc20 extends BurnErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC, Currency.ONE, Currency.MATIC])
  public chain: Currency;
}

export class ChainDeployErc20 extends DeployErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC, Currency.ONE])
  public chain: Currency;
}

export class ChainMintErc20 extends MintErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC, Currency.ONE])
  public chain: Currency;
}

export class ChainTransferErc20 extends TransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.XDC])
  public chain: Currency;
}

export class ChainTransferHrm20 extends OneTransfer20 {
  @IsNotEmpty()
  @IsIn([Currency.ONE])
  public chain: Currency;
}

export class ChainTransferEthErc20 extends TransferEthErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC])
  public chain: Currency;
}

export class ChainTransferPolygonErc20 extends TransferCustomErc20 {
  @IsNotEmpty()
  @IsIn([Currency.MATIC])
  public chain: Currency;
}

export class ChainTransferBscBep20 extends TransferBscBep20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC])
  public chain: Currency;
}

export class ChainBurnCeloErc20 extends BurnCeloErc20 {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainDeployCeloErc20 extends DeployCeloErc20 {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainMintCeloErc20 extends MintCeloErc20 {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainTransferCeloErc20Token extends TransferCeloOrCeloErc20Token {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}
