import { IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import {
  WorkflowNode,
  WorkflowEdge,
  WorkflowContainer,
  WorkflowViewport,
} from '../entities/workflow.entity';

export class UpdateWorkflowContentDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  nodes?: WorkflowNode[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  edges?: WorkflowEdge[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  containers?: WorkflowContainer[];

  @IsOptional()
  @IsObject()
  viewport?: WorkflowViewport;
}
