import {IsNotEmpty, Length} from 'class-validator';
import {PathChain} from './PathChain';

export class PathAddressContractBatch extends PathChain {

    @IsNotEmpty()
    @Length(42, 43)
    public contractAddress: string;

}
