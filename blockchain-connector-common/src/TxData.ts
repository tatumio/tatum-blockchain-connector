import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class TxData {
    @IsString()
    @IsNotEmpty()
    txData: string

    @IsString()
    @IsOptional()
    signatureId?: string

    @IsString()
    @IsOptional()
    withdrawalId?: string
}