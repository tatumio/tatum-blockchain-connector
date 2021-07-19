import {Currency} from '@tatumio/tatum';
import {IsIn, IsNotEmpty} from 'class-validator';

export class PathChain {

    @IsNotEmpty()
    @IsIn([Currency.ETH, Currency.CELO, Currency.BSC, Currency.FLOW, Currency.XDC, Currency.TRON, Currency.ONE, Currency.MATIC])
    public chain: Currency;
}
