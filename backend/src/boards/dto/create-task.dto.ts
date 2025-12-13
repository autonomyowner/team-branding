import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  columnId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  assigneeName?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  storyPoints?: number;
}
