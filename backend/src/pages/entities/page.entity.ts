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

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout'
  | 'toggle'
  | 'embed'
  | 'table';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: {
    checked?: boolean;
    language?: string;
    calloutType?: 'info' | 'warning' | 'success' | 'error';
    embedType?: 'workflow' | 'link' | 'image';
    embedId?: string;
    tableData?: string[][];
    collapsed?: boolean;
  };
  children?: string[];
  parentId?: string;
  position: number;
}

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.pages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Project, (project) => project.pages, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Column()
  title: string;

  @Column({ name: 'cover_image', nullable: true })
  coverImage: string;

  @Column({ type: 'jsonb', default: [] })
  blocks: Block[];

  @Column({ name: 'parent_page_id', nullable: true })
  parentPageId: string;

  @Column({ type: 'jsonb', default: [] })
  childPageIds: string[];

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'last_edited_by', nullable: true })
  lastEditedBy: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
