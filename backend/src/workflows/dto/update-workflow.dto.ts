import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { WorkflowStatus } from '../entities/workflow.entity';

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['draft', 'active', 'archived'])
  status?: WorkflowStatus;
}
