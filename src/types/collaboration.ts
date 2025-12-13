// ============ WORKFLOW BUILDER TYPES ============
export interface WorkflowNode {
  id: string;
  type: 'start' | 'action' | 'condition' | 'delay' | 'end' | 'integration';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
  };
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: 'top' | 'right' | 'bottom' | 'left';
  targetHandle?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  condition?: string;
}

export interface VisualWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: string[];
  isPublic: boolean;
  status: 'draft' | 'active' | 'archived';
}

// ============ KANBAN TYPES ============
export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
}

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
  items: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  columnId: string;
  boardId: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  labels: string[];
  position: number;
  storyPoints?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  checklists: TaskChecklist[];
  attachments: string[];
}

export interface KanbanColumn {
  id: string;
  name: string;
  boardId: string;
  position: number;
  taskLimit?: number;
  color?: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  columns: KanbanColumn[];
  labels: KanbanLabel[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  isArchived: boolean;
}

// ============ ROADMAP/TIMELINE TYPES ============
export interface Milestone {
  id: string;
  roadmapId: string;
  name: string;
  description?: string;
  targetDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  color?: string;
}

export interface RoadmapItem {
  id: string;
  roadmapId: string;
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
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
}

export interface Roadmap {
  id: string;
  name: string;
  description?: string;
  items: RoadmapItem[];
  milestones: Milestone[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  isArchived: boolean;
}

// ============ SPRINT PLANNING TYPES ============
export type BacklogItemType = 'story' | 'bug' | 'task' | 'epic';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface BacklogItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: BacklogItemType;
  priority: Priority;
  storyPoints?: number;
  status: 'backlog' | 'ready' | 'in_sprint' | 'done';
  sprintId?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  acceptanceCriteria?: string[];
  labels: string[];
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  velocity?: number;
  committedPoints: number;
  completedPoints: number;
  items: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  key: string;
  sprints: Sprint[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  averageVelocity?: number;
  currentSprintId?: string;
  isArchived: boolean;
}

// ============ NOTIFICATIONS/ACTIVITY TYPES ============
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

export type EntityType = 'task' | 'sprint' | 'roadmap' | 'workflow' | 'project' | 'board' | 'backlog_item';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: EntityType;
  entityId: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  details?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export type StatusUpdateType = 'progress' | 'blocker' | 'announcement' | 'milestone';

export interface StatusUpdate {
  id: string;
  projectId?: string;
  boardId?: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  type: StatusUpdateType;
  createdAt: string;
  reactions: { userId: string; emoji: string }[];
  pinned: boolean;
}

// ============ USER EXTENSION ============
export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
}

// ============ STORAGE KEYS ============
export const STORAGE_KEYS = {
  USERS: 'nexus_users',
  CURRENT_USER: 'nexus_current_user',
  VISUAL_WORKFLOWS: 'nexus_visual_workflows',
  KANBAN_BOARDS: 'nexus_kanban_boards',
  KANBAN_TASKS: 'nexus_kanban_tasks',
  ROADMAPS: 'nexus_roadmaps',
  PROJECTS: 'nexus_projects',
  BACKLOG_ITEMS: 'nexus_backlog_items',
  NOTIFICATIONS: 'nexus_notifications',
  ACTIVITY_FEED: 'nexus_activity_feed',
  STATUS_UPDATES: 'nexus_status_updates',
  TEAM_MEMBERS: 'nexus_team_members',
  TEAM_WORKFLOW_PROJECTS: 'nexus_team_workflow_projects',
  TEAM_WORKFLOWS: 'nexus_team_workflows',
  PAGES: 'nexus_pages',
  PROJECT_ACTIVITY: 'nexus_project_activity',
  USER_PRESENCE: 'nexus_user_presence',
} as const;

// ============ TEAM WORKFLOW PROJECT TYPES ============
export interface TeamWorkflowProject {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  workflows: string[];
  pages: string[];
  settings: ProjectSettings;
  isArchived: boolean;
}

export interface ProjectMember {
  userId: string;
  userName: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  lastActiveAt?: string;
  cursorPosition?: { x: number; y: number };
  currentPageId?: string;
}

export interface ProjectSettings {
  defaultWorkflowTemplate?: string;
  allowPublicView: boolean;
  notifyOnChanges: boolean;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'deleted' | 'joined' | 'left' | 'commented';
  entityType: 'workflow' | 'page' | 'block' | 'member';
  entityId: string;
  entityName: string;
  details?: string;
  createdAt: string;
}

// ============ ENHANCED WORKFLOW NODE TYPES ============
export type EnhancedNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'delay'
  | 'loop'
  | 'integration'
  | 'transform'
  | 'end';

export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
}

export interface EnhancedWorkflowNode {
  id: string;
  type: EnhancedNodeType;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
    triggerType?: 'webhook' | 'schedule' | 'event' | 'manual';
    conditions?: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
    integrationId?: string;
    integrationConfig?: Record<string, unknown>;
  };
  handles: NodeHandle[];
  locked?: boolean;
  selected?: boolean;
}

export interface EnhancedWorkflowEdge {
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

export interface TeamWorkflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  nodes: EnhancedWorkflowNode[];
  edges: EnhancedWorkflowEdge[];
  containers: WorkflowContainer[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  lastEditedBy?: string;
  currentEditors?: string[];
}

// ============ NOTION-STYLE BLOCK TYPES ============
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

export interface Page {
  id: string;
  projectId: string;
  title: string;
  coverImage?: string;
  blocks: Block[];
  parentPageId?: string;
  childPageIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
  isArchived: boolean;
}

// ============ PRESENCE SIMULATION TYPES ============
export interface UserPresence {
  id: string;
  userId: string;
  userName: string;
  color: string;
  pageId?: string;
  workflowId?: string;
  cursorPosition?: { x: number; y: number };
  selection?: {
    blockId?: string;
    nodeId?: string;
  };
  lastActiveAt: string;
  status: 'active' | 'idle' | 'away';
}
