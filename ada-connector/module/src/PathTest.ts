import { IsInt, IsNotEmpty, IsNumberString, Length, Matches, Max, Min } from 'class-validator'

export class PathTest {
  @IsNotEmpty()
  @Length(5, 256)
  public xpub: string;

  @IsNumberString()
  @Matches(/[0-9]+/)
  public i: string;
}
