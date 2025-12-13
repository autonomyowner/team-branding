import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { Workflow } from '../../workflows/entities/workflow.entity';
import { Board } from '../../boards/entities/board.entity';
import { Project } from '../../projects/entities/project.entity';
import { Roadmap } from '../../roadmaps/entities/roadmap.entity';
import { Page } from '../../pages/entities/page.entity';

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'free' })
  planTier: PlanTier;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, unknown>;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => Workflow, (workflow) => workflow.workspace)
  workflows: Workflow[];

  @OneToMany(() => Board, (board) => board.workspace)
  boards: Board[];

  @OneToMany(() => Project, (project) => project.workspace)
  projects: Project[];

  @OneToMany(() => Roadmap, (roadmap) => roadmap.workspace)
  roadmaps: Roadmap[];

  @OneToMany(() => Page, (page) => page.workspace)
  pages: Page[];
}
