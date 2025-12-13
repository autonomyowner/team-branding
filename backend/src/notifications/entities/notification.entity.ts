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

export type NotificationType =
  | 'task_assigned'
  | 'comment_added'
  | 'due_date_reminder'
  | 'sprint_started'
  | 'sprint_ended'
  | 'milestone_reached'
  | 'workflow_shared'
  | 'mention'
  | 'status_update'
  | 'item_completed';

export type EntityType =
  | 'task'
  | 'sprint'
  | 'roadmap'
  | 'workflow'
  | 'project'
  | 'board'
  | 'backlog_item'
  | 'page';

@Entity('notifications')
@Index(['userId', 'read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType: EntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ name: 'action_url', nullable: true })
  actionUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
