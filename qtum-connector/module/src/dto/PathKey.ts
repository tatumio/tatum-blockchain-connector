import { IsNotEmpty, Length } from 'class-validator';

export class PathKey {

  @IsNotEmpty()
  @Length(1, 52)
  public key: string;
}
