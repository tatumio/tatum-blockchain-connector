import { IsNotEmpty, IsString } from 'class-validator'

export class TxData {
  @IsString()
  @IsNotEmpty()
  txData: string
}