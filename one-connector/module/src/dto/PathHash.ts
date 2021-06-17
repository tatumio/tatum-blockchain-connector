import { IsNotEmpty, Length } from 'class-validator';

export class PathHash {
  @IsNotEmpty()
  @Length(1, 66)
  public hash: string;
}
