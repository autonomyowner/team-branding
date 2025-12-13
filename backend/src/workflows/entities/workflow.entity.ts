import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Project } from '../../projects/entities/project.entity';

export type WorkflowStatus = 'draft' | 'active' | 'archived';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
    triggerType?: string;
    conditions?: Array<{ field: string; operator: string; value: string }>;
    integrationId?: string;
    integrationConfig?: Record<string, unknown>;
  };
  handles?: Array<{
    id: string;
    type: string;
    position: string;
    label?: string;
  }>;
  locked?: boolean;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourceHandleId: string;
  targetNodeId: string;
  targetHandleId: string;
  label?: string;
  condition?: string;
  style?: {
    strokeColor?: string;
    animated?: boolean;
  };
}

export interface WorkflowContainer {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.workflows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Project, (project) => project.workflows, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  nodes: WorkflowNode[];

  @Column({ type: 'jsonb', default: [] })
  edges: WorkflowEdge[];

  @Column({ type: 'jsonb', default: [] })
  containers: WorkflowContainer[];

  @Column({ type: 'jsonb', default: { x: 0, y: 0, zoom: 1 } })
  viewport: WorkflowViewport;

  @Column({ type: 'varchar', default: 'draft' })
  status: WorkflowStatus;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'last_edited_by', nullable: true })
  lastEditedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
