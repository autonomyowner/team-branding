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

export type RoadmapItemStatus = 'planned' | 'in_progress' | 'completed' | 'blocked';
export type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'delayed';

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  progress: number;
  assigneeId?: string;
  assigneeName?: string;
  dependencies: string[];
  milestoneId?: string;
  color?: string;
  status: RoadmapItemStatus;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  targetDate: string;
  status: MilestoneStatus;
  color?: string;
}

@Entity('roadmaps')
export class Roadmap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.roadmaps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  items: RoadmapItem[];

  @Column({ type: 'jsonb', default: [] })
  milestones: Milestone[];

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
