import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class GetTransactionsByAccountQuery {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(50)
  public pageSize: number;

  @IsNotEmpty()
  @IsInt()
  public offset: number;
}
