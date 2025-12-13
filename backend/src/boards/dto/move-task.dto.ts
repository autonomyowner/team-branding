import { IsString, IsNumber, Min } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  columnId: string;

  @IsNumber()
  @Min(0)
  position: number;
}
