import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export type EntityType =
  | 'task'
  | 'sprint'
  | 'roadmap'
  | 'workflow'
  | 'project'
  | 'board'
  | 'backlog_item'
  | 'page'
  | 'workspace'
  | 'member';

@Entity('activity_logs')
@Index(['workspaceId', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'user_name' })
  userName: string;

  @Column()
  action: string;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType: EntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_name' })
  entityName: string;

  @Column({ nullable: true })
  details: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
