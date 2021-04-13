import { IsOptional, MaxLength } from 'class-validator';

export class GenerateWalletMnemonic {
  @IsOptional()
  @MaxLength(500)
  public mnemonic?: string;
}
