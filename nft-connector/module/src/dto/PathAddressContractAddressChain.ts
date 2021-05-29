import {IsNotEmpty, Length} from 'class-validator';
import {PathChain} from './PathChain';

export class PathAddressContractAddressChain extends PathChain {

    @IsNotEmpty()
    @Length(36, 42)
    public contractAddress: string;

    @IsNotEmpty()
    @Length(18, 43)
    public address: string;
}
