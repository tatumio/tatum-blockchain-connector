import { PathAddress } from './PathAddress'
import { IsNotEmpty, Length } from 'class-validator'

export class PathAddressContractAddress extends PathAddress {
  @IsNotEmpty()
  @Length(42, 43)
  public contractAddress: string;
}