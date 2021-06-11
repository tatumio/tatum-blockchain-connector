import {IsNotEmpty, Length} from 'class-validator';
import {PathChain} from './PathChain';

export class PathTokenIdContractAddressChain extends PathChain {

    @IsNotEmpty()
    @Length(34, 43)
    public contractAddress: string;

    @IsNotEmpty()
    @Length(1, 256)
    public tokenId: string;
}
