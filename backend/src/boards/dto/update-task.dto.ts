import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';
import { TaskComment, TaskChecklist } from '../entities/task.entity';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['columnId'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  comments?: TaskComment[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  checklists?: TaskChecklist[];

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
