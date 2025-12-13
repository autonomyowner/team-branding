import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsNumber()
  position: number;

  @IsOptional()
  @IsNumber()
  taskLimit?: number;

  @IsOptional()
  @IsString()
  color?: string;
}
