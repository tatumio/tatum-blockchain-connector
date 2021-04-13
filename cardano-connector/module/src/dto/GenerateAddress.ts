import { IsInt, IsNotEmpty, Length, Max, Min } from 'class-validator';

export class GenerateAddress {
  @Length(128, 128)
  public xpub: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  public index: number;
}
