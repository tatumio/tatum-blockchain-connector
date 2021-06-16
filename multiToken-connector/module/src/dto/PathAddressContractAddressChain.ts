import {IsNotEmpty, IsNumberString, Length} from 'class-validator';
import {PathChain} from './PathChain';

export class PathAddressContractAddressChain extends PathChain {

    @IsNotEmpty()
    @Length(42, 43)
    public contractAddress: string;

    @IsNotEmpty()
    @Length(42, 43)
    public address: string;

    @IsNotEmpty()
    @IsNumberString()
    public tokenId: string;
}
