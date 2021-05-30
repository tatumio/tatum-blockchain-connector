import { Currency } from "@tatumio/tatum";
import { IsIn, IsNotEmpty } from "class-validator";

export class PathChain {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.CELO, Currency.TRON, Currency.BSC, Currency.XDC])
  public chain: Currency;
}
