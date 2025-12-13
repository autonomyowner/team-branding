import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Sprint } from './sprint.entity';
import { BacklogItem } from './backlog-item.entity';
import { Workflow } from '../../workflows/entities/workflow.entity';
import { Page } from '../../pages/entities/page.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.projects, {
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

  @Column({ unique: true })
  key: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'average_velocity', type: 'float', nullable: true })
  averageVelocity: number;

  @Column({ name: 'current_sprint_id', nullable: true })
  currentSprintId: string | null;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => BacklogItem, (item) => item.project)
  backlogItems: BacklogItem[];

  @OneToMany(() => Workflow, (workflow) => workflow.project)
  workflows: Workflow[];

  @OneToMany(() => Page, (page) => page.project)
  pages: Page[];
}
