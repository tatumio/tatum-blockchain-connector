import { IsNotEmpty, Length } from 'class-validator';

export class PathId {

  @IsNotEmpty()
  @Length(7, 150)
  public id: string;
}
