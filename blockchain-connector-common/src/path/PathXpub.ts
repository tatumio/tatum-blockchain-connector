import { IsNotEmpty, Length } from 'class-validator';
import { PathI } from './PathI';

export class PathXpub extends PathI {
  @IsNotEmpty()
  @Length(5, 256)
  public xpub: string;
}
