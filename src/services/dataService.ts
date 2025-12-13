import { nanoid } from 'nanoid';
import {
  KanbanBoard,
  KanbanTask,
  KanbanColumn,
  VisualWorkflow,
  Roadmap,
  RoadmapItem,
  Milestone,
  Project,
  Sprint,
  BacklogItem,
  Notification,
  ActivityItem,
  StatusUpdate,
  TeamMember,
  STORAGE_KEYS,
} from '@/types/collaboration';

// ============ HELPER FUNCTIONS ============
const getFromStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const generateId = (prefix: string): string => `${prefix}_${nanoid(12)}`;

// ============ KANBAN BOARDS ============
export const boardService = {
  getAll: (): KanbanBoard[] => getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS),

  getById: (id: string): KanbanBoard | undefined => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    return boards.find((b) => b.id === id);
  },

  create: (board: Omit<KanbanBoard, 'id' | 'createdAt' | 'updatedAt'>): KanbanBoard => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const newBoard: KanbanBoard = {
      ...board,
      id: generateId('board'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    boards.push(newBoard);
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards);
    return newBoard;
  },

  update: (id: string, updates: Partial<KanbanBoard>): KanbanBoard | undefined => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const index = boards.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    boards[index] = { ...boards[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards);
    return boards[index];
  },

  delete: (id: string): boolean => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const filtered = boards.filter((b) => b.id !== id);
    if (filtered.length === boards.length) return false;
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, filtered);
    // Also delete associated tasks
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    setToStorage(STORAGE_KEYS.KANBAN_TASKS, tasks.filter((t) => t.boardId !== id));
    return true;
  },

  addColumn: (boardId: string, column: Omit<KanbanColumn, 'id' | 'boardId'>): KanbanColumn | undefined => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const index = boards.findIndex((b) => b.id === boardId);
    if (index === -1) return undefined;
    const newColumn: KanbanColumn = {
      ...column,
      id: generateId('col'),
      boardId,
    };
    boards[index].columns.push(newColumn);
    boards[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards);
    return newColumn;
  },

  updateColumn: (boardId: string, columnId: string, updates: Partial<KanbanColumn>): boolean => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const boardIndex = boards.findIndex((b) => b.id === boardId);
    if (boardIndex === -1) return false;
    const colIndex = boards[boardIndex].columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) return false;
    boards[boardIndex].columns[colIndex] = { ...boards[boardIndex].columns[colIndex], ...updates };
    boards[boardIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards);
    return true;
  },

  deleteColumn: (boardId: string, columnId: string): boolean => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const boardIndex = boards.findIndex((b) => b.id === boardId);
    if (boardIndex === -1) return false;
    boards[boardIndex].columns = boards[boardIndex].columns.filter((c) => c.id !== columnId);
    boards[boardIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards);
    // Also delete tasks in this column
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    setToStorage(STORAGE_KEYS.KANBAN_TASKS, tasks.filter((t) => t.columnId !== columnId));
    return true;
  },

  reorderColumns: (boardId: string, columnIds: string[]): boolean => {
    const boards = getFromStorage<KanbanBoard>(STORAGE_KEYS.KANBAN_BOARDS);
    const boardIndex = boards.findIndex((b) => b.id === boardId);
    if (boardIndex === -1) return false;
    const columnMap = new Map(boards[boardIndex].columns.map((c) => [c.id, c]));
    boards[boardIndex].columns = columnIds
      .map((id, index) => {
        const col = columnMap.get(id);
        return col ? { ...col, position: index } : null;
      })
      .filter((c): c is KanbanColumn => c !== null);
    boards[boardIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.KANBAN_BOARDS, boards);
    return true;
  },
};

// ============ KANBAN TASKS ============
export const taskService = {
  getAll: (): KanbanTask[] => getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS),

  getByBoard: (boardId: string): KanbanTask[] => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    return tasks.filter((t) => t.boardId === boardId);
  },

  getById: (id: string): KanbanTask | undefined => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    return tasks.find((t) => t.id === id);
  },

  create: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>): KanbanTask => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    const newTask: KanbanTask = {
      ...task,
      id: generateId('task'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    setToStorage(STORAGE_KEYS.KANBAN_TASKS, tasks);
    return newTask;
  },

  update: (id: string, updates: Partial<KanbanTask>): KanbanTask | undefined => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.KANBAN_TASKS, tasks);
    return tasks[index];
  },

  delete: (id: string): boolean => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;
    setToStorage(STORAGE_KEYS.KANBAN_TASKS, filtered);
    return true;
  },

  moveTask: (taskId: string, columnId: string, position: number): KanbanTask | undefined => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return undefined;

    const task = tasks[taskIndex];
    const oldColumnId = task.columnId;

    // Update positions in old column
    if (oldColumnId !== columnId) {
      tasks
        .filter((t) => t.columnId === oldColumnId && t.position > task.position)
        .forEach((t) => t.position--);
    }

    // Update positions in new column
    tasks
      .filter((t) => t.columnId === columnId && t.position >= position && t.id !== taskId)
      .forEach((t) => t.position++);

    // Update the task
    tasks[taskIndex] = {
      ...task,
      columnId,
      position,
      updatedAt: new Date().toISOString(),
    };

    setToStorage(STORAGE_KEYS.KANBAN_TASKS, tasks);
    return tasks[taskIndex];
  },

  addComment: (taskId: string, comment: Omit<KanbanTask['comments'][0], 'id' | 'createdAt'>): boolean => {
    const tasks = getFromStorage<KanbanTask>(STORAGE_KEYS.KANBAN_TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return false;
    tasks[index].comments.push({
      ...comment,
      id: generateId('comment'),
      createdAt: new Date().toISOString(),
    });
    tasks[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.KANBAN_TASKS, tasks);
    return true;
  },
};

// ============ VISUAL WORKFLOWS ============
export const workflowService = {
  getAll: (): VisualWorkflow[] => getFromStorage<VisualWorkflow>(STORAGE_KEYS.VISUAL_WORKFLOWS),

  getById: (id: string): VisualWorkflow | undefined => {
    const workflows = getFromStorage<VisualWorkflow>(STORAGE_KEYS.VISUAL_WORKFLOWS);
    return workflows.find((w) => w.id === id);
  },

  create: (workflow: Omit<VisualWorkflow, 'id' | 'createdAt' | 'updatedAt'>): VisualWorkflow => {
    const workflows = getFromStorage<VisualWorkflow>(STORAGE_KEYS.VISUAL_WORKFLOWS);
    const newWorkflow: VisualWorkflow = {
      ...workflow,
      id: generateId('wf'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workflows.push(newWorkflow);
    setToStorage(STORAGE_KEYS.VISUAL_WORKFLOWS, workflows);
    return newWorkflow;
  },

  update: (id: string, updates: Partial<VisualWorkflow>): VisualWorkflow | undefined => {
    const workflows = getFromStorage<VisualWorkflow>(STORAGE_KEYS.VISUAL_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === id);
    if (index === -1) return undefined;
    workflows[index] = { ...workflows[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.VISUAL_WORKFLOWS, workflows);
    return workflows[index];
  },

  delete: (id: string): boolean => {
    const workflows = getFromStorage<VisualWorkflow>(STORAGE_KEYS.VISUAL_WORKFLOWS);
    const filtered = workflows.filter((w) => w.id !== id);
    if (filtered.length === workflows.length) return false;
    setToStorage(STORAGE_KEYS.VISUAL_WORKFLOWS, filtered);
    return true;
  },
};

// ============ ROADMAPS ============
export const roadmapService = {
  getAll: (): Roadmap[] => getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS),

  getById: (id: string): Roadmap | undefined => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    return roadmaps.find((r) => r.id === id);
  },

  create: (roadmap: Omit<Roadmap, 'id' | 'createdAt' | 'updatedAt'>): Roadmap => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const newRoadmap: Roadmap = {
      ...roadmap,
      id: generateId('roadmap'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    roadmaps.push(newRoadmap);
    setToStorage(STORAGE_KEYS.ROADMAPS, roadmaps);
    return newRoadmap;
  },

  update: (id: string, updates: Partial<Roadmap>): Roadmap | undefined => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const index = roadmaps.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    roadmaps[index] = { ...roadmaps[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.ROADMAPS, roadmaps);
    return roadmaps[index];
  },

  delete: (id: string): boolean => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const filtered = roadmaps.filter((r) => r.id !== id);
    if (filtered.length === roadmaps.length) return false;
    setToStorage(STORAGE_KEYS.ROADMAPS, filtered);
    return true;
  },

  addItem: (roadmapId: string, item: Omit<RoadmapItem, 'id' | 'roadmapId'>): RoadmapItem | undefined => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const index = roadmaps.findIndex((r) => r.id === roadmapId);
    if (index === -1) return undefined;
    const newItem: RoadmapItem = {
      ...item,
      id: generateId('ritem'),
      roadmapId,
    };
    roadmaps[index].items.push(newItem);
    roadmaps[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.ROADMAPS, roadmaps);
    return newItem;
  },

  updateItem: (roadmapId: string, itemId: string, updates: Partial<RoadmapItem>): boolean => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const roadmapIndex = roadmaps.findIndex((r) => r.id === roadmapId);
    if (roadmapIndex === -1) return false;
    const itemIndex = roadmaps[roadmapIndex].items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return false;
    roadmaps[roadmapIndex].items[itemIndex] = { ...roadmaps[roadmapIndex].items[itemIndex], ...updates };
    roadmaps[roadmapIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.ROADMAPS, roadmaps);
    return true;
  },

  deleteItem: (roadmapId: string, itemId: string): boolean => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const roadmapIndex = roadmaps.findIndex((r) => r.id === roadmapId);
    if (roadmapIndex === -1) return false;
    roadmaps[roadmapIndex].items = roadmaps[roadmapIndex].items.filter((i) => i.id !== itemId);
    roadmaps[roadmapIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.ROADMAPS, roadmaps);
    return true;
  },

  addMilestone: (roadmapId: string, milestone: Omit<Milestone, 'id' | 'roadmapId'>): Milestone | undefined => {
    const roadmaps = getFromStorage<Roadmap>(STORAGE_KEYS.ROADMAPS);
    const index = roadmaps.findIndex((r) => r.id === roadmapId);
    if (index === -1) return undefined;
    const newMilestone: Milestone = {
      ...milestone,
      id: generateId('ms'),
      roadmapId,
    };
    roadmaps[index].milestones.push(newMilestone);
    roadmaps[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.ROADMAPS, roadmaps);
    return newMilestone;
  },
};

// ============ PROJECTS & SPRINTS ============
export const projectService = {
  getAll: (): Project[] => getFromStorage<Project>(STORAGE_KEYS.PROJECTS),

  getById: (id: string): Project | undefined => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    return projects.find((p) => p.id === id);
  },

  create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sprints'>): Project => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const newProject: Project = {
      ...project,
      id: generateId('proj'),
      sprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(newProject);
    setToStorage(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  },

  update: (id: string, updates: Partial<Project>): Project | undefined => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.PROJECTS, projects);
    return projects[index];
  },

  delete: (id: string): boolean => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;
    setToStorage(STORAGE_KEYS.PROJECTS, filtered);
    // Also delete backlog items
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    setToStorage(STORAGE_KEYS.BACKLOG_ITEMS, items.filter((i) => i.projectId !== id));
    return true;
  },

  createSprint: (projectId: string, sprint: Omit<Sprint, 'id' | 'projectId' | 'items'>): Sprint | undefined => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) return undefined;
    const newSprint: Sprint = {
      ...sprint,
      id: generateId('sprint'),
      projectId,
      items: [],
    };
    projects[index].sprints.push(newSprint);
    projects[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PROJECTS, projects);
    return newSprint;
  },

  updateSprint: (projectId: string, sprintId: string, updates: Partial<Sprint>): boolean => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return false;
    const sprintIndex = projects[projIndex].sprints.findIndex((s) => s.id === sprintId);
    if (sprintIndex === -1) return false;
    projects[projIndex].sprints[sprintIndex] = { ...projects[projIndex].sprints[sprintIndex], ...updates };
    projects[projIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PROJECTS, projects);
    return true;
  },

  startSprint: (projectId: string, sprintId: string): boolean => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return false;
    const sprintIndex = projects[projIndex].sprints.findIndex((s) => s.id === sprintId);
    if (sprintIndex === -1) return false;
    projects[projIndex].sprints[sprintIndex].status = 'active';
    projects[projIndex].currentSprintId = sprintId;
    projects[projIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PROJECTS, projects);
    return true;
  },

  completeSprint: (projectId: string, sprintId: string): boolean => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return false;
    const sprintIndex = projects[projIndex].sprints.findIndex((s) => s.id === sprintId);
    if (sprintIndex === -1) return false;

    const sprint = projects[projIndex].sprints[sprintIndex];
    sprint.status = 'completed';
    sprint.velocity = sprint.completedPoints;

    // Update average velocity
    const completedSprints = projects[projIndex].sprints.filter((s) => s.status === 'completed');
    const totalVelocity = completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0);
    projects[projIndex].averageVelocity = totalVelocity / completedSprints.length;

    if (projects[projIndex].currentSprintId === sprintId) {
      projects[projIndex].currentSprintId = undefined;
    }
    projects[projIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PROJECTS, projects);
    return true;
  },
};

// ============ BACKLOG ITEMS ============
export const backlogService = {
  getAll: (): BacklogItem[] => getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS),

  getByProject: (projectId: string): BacklogItem[] => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    return items.filter((i) => i.projectId === projectId);
  },

  getById: (id: string): BacklogItem | undefined => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    return items.find((i) => i.id === id);
  },

  create: (item: Omit<BacklogItem, 'id' | 'createdAt' | 'updatedAt'>): BacklogItem => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    const newItem: BacklogItem = {
      ...item,
      id: generateId('item'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    setToStorage(STORAGE_KEYS.BACKLOG_ITEMS, items);
    return newItem;
  },

  update: (id: string, updates: Partial<BacklogItem>): BacklogItem | undefined => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.BACKLOG_ITEMS, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    setToStorage(STORAGE_KEYS.BACKLOG_ITEMS, filtered);
    return true;
  },

  moveToSprint: (itemId: string, sprintId: string): boolean => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    items[index].sprintId = sprintId;
    items[index].status = 'in_sprint';
    items[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.BACKLOG_ITEMS, items);
    return true;
  },

  removeFromSprint: (itemId: string): boolean => {
    const items = getFromStorage<BacklogItem>(STORAGE_KEYS.BACKLOG_ITEMS);
    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    items[index].sprintId = undefined;
    items[index].status = 'ready';
    items[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.BACKLOG_ITEMS, items);
    return true;
  },
};

// ============ NOTIFICATIONS ============
export const notificationService = {
  getAll: (userId: string): Notification[] => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    return notifications.filter((n) => n.userId === userId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getUnreadCount: (userId: string): number => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    return notifications.filter((n) => n.userId === userId && !n.read).length;
  },

  create: (notification: Omit<Notification, 'id' | 'createdAt'>): Notification => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const newNotification: Notification = {
      ...notification,
      id: generateId('notif'),
      createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },

  markAsRead: (id: string): boolean => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;
    notifications[index].read = true;
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return true;
  },

  markAllAsRead: (userId: string): void => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  delete: (id: string): boolean => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const filtered = notifications.filter((n) => n.id !== id);
    if (filtered.length === notifications.length) return false;
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, filtered);
    return true;
  },
};

// ============ ACTIVITY FEED ============
export const activityService = {
  getAll: (limit = 50): ActivityItem[] => {
    const activities = getFromStorage<ActivityItem>(STORAGE_KEYS.ACTIVITY_FEED);
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  create: (activity: Omit<ActivityItem, 'id' | 'createdAt'>): ActivityItem => {
    const activities = getFromStorage<ActivityItem>(STORAGE_KEYS.ACTIVITY_FEED);
    const newActivity: ActivityItem = {
      ...activity,
      id: generateId('activity'),
      createdAt: new Date().toISOString(),
    };
    activities.push(newActivity);
    // Keep only last 500 activities
    if (activities.length > 500) {
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      activities.splice(500);
    }
    setToStorage(STORAGE_KEYS.ACTIVITY_FEED, activities);
    return newActivity;
  },
};

// ============ STATUS UPDATES ============
export const statusUpdateService = {
  getAll: (limit = 20): StatusUpdate[] => {
    const updates = getFromStorage<StatusUpdate>(STORAGE_KEYS.STATUS_UPDATES);
    return updates
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  },

  create: (update: Omit<StatusUpdate, 'id' | 'createdAt' | 'reactions'>): StatusUpdate => {
    const updates = getFromStorage<StatusUpdate>(STORAGE_KEYS.STATUS_UPDATES);
    const newUpdate: StatusUpdate = {
      ...update,
      id: generateId('status'),
      createdAt: new Date().toISOString(),
      reactions: [],
    };
    updates.push(newUpdate);
    setToStorage(STORAGE_KEYS.STATUS_UPDATES, updates);
    return newUpdate;
  },

  addReaction: (updateId: string, userId: string, emoji: string): boolean => {
    const updates = getFromStorage<StatusUpdate>(STORAGE_KEYS.STATUS_UPDATES);
    const index = updates.findIndex((u) => u.id === updateId);
    if (index === -1) return false;

    // Remove existing reaction from this user
    updates[index].reactions = updates[index].reactions.filter((r) => r.userId !== userId);
    // Add new reaction
    updates[index].reactions.push({ userId, emoji });
    setToStorage(STORAGE_KEYS.STATUS_UPDATES, updates);
    return true;
  },

  togglePin: (updateId: string): boolean => {
    const updates = getFromStorage<StatusUpdate>(STORAGE_KEYS.STATUS_UPDATES);
    const index = updates.findIndex((u) => u.id === updateId);
    if (index === -1) return false;
    updates[index].pinned = !updates[index].pinned;
    setToStorage(STORAGE_KEYS.STATUS_UPDATES, updates);
    return true;
  },

  delete: (id: string): boolean => {
    const updates = getFromStorage<StatusUpdate>(STORAGE_KEYS.STATUS_UPDATES);
    const filtered = updates.filter((u) => u.id !== id);
    if (filtered.length === updates.length) return false;
    setToStorage(STORAGE_KEYS.STATUS_UPDATES, filtered);
    return true;
  },
};

// ============ TEAM MEMBERS ============
export const teamService = {
  getAll: (): TeamMember[] => getFromStorage<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS),

  getById: (id: string): TeamMember | undefined => {
    const members = getFromStorage<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS);
    return members.find((m) => m.id === id);
  },

  add: (member: Omit<TeamMember, 'id' | 'joinedAt'>): TeamMember => {
    const members = getFromStorage<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS);
    const newMember: TeamMember = {
      ...member,
      id: generateId('member'),
      joinedAt: new Date().toISOString(),
    };
    members.push(newMember);
    setToStorage(STORAGE_KEYS.TEAM_MEMBERS, members);
    return newMember;
  },

  update: (id: string, updates: Partial<TeamMember>): TeamMember | undefined => {
    const members = getFromStorage<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS);
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) return undefined;
    members[index] = { ...members[index], ...updates };
    setToStorage(STORAGE_KEYS.TEAM_MEMBERS, members);
    return members[index];
  },

  remove: (id: string): boolean => {
    const members = getFromStorage<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS);
    const filtered = members.filter((m) => m.id !== id);
    if (filtered.length === members.length) return false;
    setToStorage(STORAGE_KEYS.TEAM_MEMBERS, filtered);
    return true;
  },
};
