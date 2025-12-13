import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Board } from './board.entity';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TaskChecklist {
  id: string;
  title: string;
  items: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Board, (board) => board.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column({ name: 'board_id' })
  boardId: string;

  @Column({ name: 'column_id' })
  columnId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @Column({ name: 'assignee_name', nullable: true })
  assigneeName: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'jsonb', default: [] })
  labels: string[];

  @Column({ default: 0 })
  position: number;

  @Column({ name: 'story_points', nullable: true })
  storyPoints: number;

  @Column({ type: 'varchar', default: 'medium' })
  priority: TaskPriority;

  @Column({ type: 'jsonb', default: [] })
  comments: TaskComment[];

  @Column({ type: 'jsonb', default: [] })
  checklists: TaskChecklist[];

  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
