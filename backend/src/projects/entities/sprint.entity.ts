import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { BacklogItem } from './backlog-item.entity';

export type SprintStatus = 'planning' | 'active' | 'completed';

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.sprints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  goal: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'varchar', default: 'planning' })
  status: SprintStatus;

  @Column({ type: 'float', nullable: true })
  velocity: number;

  @Column({ name: 'committed_points', default: 0 })
  committedPoints: number;

  @Column({ name: 'completed_points', default: 0 })
  completedPoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => BacklogItem, (item) => item.sprint)
  items: BacklogItem[];
}
