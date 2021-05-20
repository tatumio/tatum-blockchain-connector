import { IsIn, IsNotEmpty, Length } from "class-validator";

import {
  Currency,
  BurnErc20,
  DeployErc20,
  MintErc20,
  TransferEthErc20,
  TransferBscBep20,
  BurnCeloErc20,
  DeployCeloErc20,
  MintCeloErc20,
  TransferCeloOrCeloErc20Token,
  SmartContractMethodInvocation,
  CeloSmartContractMethodInvocation,
} from '@tatumio/tatum';

export class ChainBurnErc20 extends BurnErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC])
  public chain: Currency;
}

export class ChainDeployErc20 extends DeployErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC])
  public chain: Currency;
}

export class ChainMintErc20 extends MintErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC])
  public chain: Currency;
}

export class ChainTransferEthErc20 extends TransferEthErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC])
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

export class ChainSmartContractMethodInvocation extends SmartContractMethodInvocation {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC])
  public chain: Currency;
}

export class ChainCeloSmartContractMethodInvocation extends CeloSmartContractMethodInvocation {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}
