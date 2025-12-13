import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Sprint } from './sprint.entity';

export type BacklogItemType = 'story' | 'bug' | 'task' | 'epic';
export type BacklogItemStatus = 'backlog' | 'ready' | 'in_sprint' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

@Entity('backlog_items')
export class BacklogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.backlogItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Sprint, (sprint) => sprint.items, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @Column({ name: 'sprint_id', nullable: true })
  sprintId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'story' })
  type: BacklogItemType;

  @Column({ type: 'varchar', default: 'medium' })
  priority: Priority;

  @Column({ name: 'story_points', nullable: true })
  storyPoints: number;

  @Column({ type: 'varchar', default: 'backlog' })
  status: BacklogItemStatus;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @Column({ name: 'assignee_name', nullable: true })
  assigneeName: string;

  @Column({ type: 'jsonb', default: [] })
  acceptanceCriteria: string[];

  @Column({ type: 'jsonb', default: [] })
  labels: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
