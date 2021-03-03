import {
  ArrayMaxSize,
  ArrayMinSize,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GenerateWalletMnemonic {
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  public name: string;

  @ArrayMinSize(15)
  @ArrayMaxSize(24)
  @IsString({ each: true })
  public mnemonic_sentence: string[];

  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(255)
  public passphrase: string;
}
