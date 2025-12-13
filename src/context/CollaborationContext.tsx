"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  KanbanBoard,
  KanbanTask,
  KanbanColumn,
  KanbanLabel,
  VisualWorkflow,
  WorkflowNode,
  WorkflowEdge,
  Roadmap,
  RoadmapItem,
  Milestone,
  Project,
  Sprint,
  BacklogItem,
  TeamMember,
} from "@/types/collaboration";
import {
  boardService,
  taskService,
  workflowService,
  roadmapService,
  projectService,
  backlogService,
  teamService,
  activityService,
  generateId,
} from "@/services/dataService";
import { useAuth } from "./AuthContext";

interface CollaborationContextType {
  // Kanban Boards
  boards: KanbanBoard[];
  tasks: KanbanTask[];
  loadBoards: () => void;
  createBoard: (name: string, description?: string) => KanbanBoard;
  updateBoard: (id: string, updates: Partial<KanbanBoard>) => void;
  deleteBoard: (id: string) => void;
  addColumn: (boardId: string, name: string, taskLimit?: number) => KanbanColumn | undefined;
  updateColumn: (boardId: string, columnId: string, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;

  // Tasks
  loadTasks: (boardId: string) => void;
  createTask: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => KanbanTask;
  updateTask: (id: string, updates: Partial<KanbanTask>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, columnId: string, position: number) => void;
  addTaskComment: (taskId: string, content: string) => void;

  // Visual Workflows
  workflows: VisualWorkflow[];
  loadWorkflows: () => void;
  createWorkflow: (name: string, description?: string) => VisualWorkflow;
  updateWorkflow: (id: string, updates: Partial<VisualWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
  saveWorkflowNodes: (workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;

  // Roadmaps
  roadmaps: Roadmap[];
  loadRoadmaps: () => void;
  createRoadmap: (name: string, description?: string) => Roadmap;
  updateRoadmap: (id: string, updates: Partial<Roadmap>) => void;
  deleteRoadmap: (id: string) => void;
  addRoadmapItem: (roadmapId: string, item: Omit<RoadmapItem, 'id' | 'roadmapId'>) => RoadmapItem | undefined;
  updateRoadmapItem: (roadmapId: string, itemId: string, updates: Partial<RoadmapItem>) => void;
  deleteRoadmapItem: (roadmapId: string, itemId: string) => void;
  addMilestone: (roadmapId: string, milestone: Omit<Milestone, 'id' | 'roadmapId'>) => Milestone | undefined;

  // Projects & Sprints
  projects: Project[];
  backlogItems: BacklogItem[];
  loadProjects: () => void;
  createProject: (name: string, key: string, description?: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createSprint: (projectId: string, sprint: Omit<Sprint, 'id' | 'projectId' | 'items'>) => Sprint | undefined;
  updateSprint: (projectId: string, sprintId: string, updates: Partial<Sprint>) => void;
  startSprint: (projectId: string, sprintId: string) => void;
  completeSprint: (projectId: string, sprintId: string) => void;

  // Backlog
  loadBacklogItems: (projectId: string) => void;
  createBacklogItem: (item: Omit<BacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => BacklogItem;
  updateBacklogItem: (id: string, updates: Partial<BacklogItem>) => void;
  deleteBacklogItem: (id: string) => void;
  moveItemToSprint: (itemId: string, sprintId: string) => void;
  removeItemFromSprint: (itemId: string) => void;

  // Team
  teamMembers: TeamMember[];
  loadTeamMembers: () => void;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => TeamMember;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;

  // Loading state
  isLoading: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [workflows, setWorkflows] = useState<VisualWorkflow[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadBoards();
      loadWorkflows();
      loadRoadmaps();
      loadProjects();
      loadTeamMembers();
      setIsLoading(false);
    }
  }, []);

  // Log activity helper
  const logActivity = useCallback((action: string, entityType: string, entityId: string, entityName: string, details?: string) => {
    if (!user) return;
    activityService.create({
      userId: user.id,
      userName: user.name,
      action,
      entityType: entityType as any,
      entityId,
      entityName,
      details,
    });
  }, [user]);

  // ============ KANBAN BOARDS ============
  const loadBoards = useCallback(() => {
    setBoards(boardService.getAll());
  }, []);

  const createBoard = useCallback((name: string, description?: string): KanbanBoard => {
    const newBoard = boardService.create({
      name,
      description,
      columns: [
        { id: generateId('col'), name: 'To Do', boardId: '', position: 0 },
        { id: generateId('col'), name: 'In Progress', boardId: '', position: 1 },
        { id: generateId('col'), name: 'Done', boardId: '', position: 2 },
      ],
      labels: [
        { id: generateId('label'), name: 'Bug', color: '#ff4757' },
        { id: generateId('label'), name: 'Feature', color: '#00fff2' },
        { id: generateId('label'), name: 'Enhancement', color: '#7bed9f' },
      ],
      createdBy: user?.id || '',
      members: user ? [user.id] : [],
      isArchived: false,
    });
    // Fix column boardIds
    newBoard.columns = newBoard.columns.map(col => ({ ...col, boardId: newBoard.id }));
    boardService.update(newBoard.id, { columns: newBoard.columns });
    setBoards(boardService.getAll());
    logActivity('created', 'board', newBoard.id, newBoard.name);
    return newBoard;
  }, [user, logActivity]);

  const updateBoard = useCallback((id: string, updates: Partial<KanbanBoard>) => {
    boardService.update(id, updates);
    setBoards(boardService.getAll());
  }, []);

  const deleteBoard = useCallback((id: string) => {
    const board = boardService.getById(id);
    if (board) {
      boardService.delete(id);
      setBoards(boardService.getAll());
      setTasks(tasks.filter(t => t.boardId !== id));
      logActivity('deleted', 'board', id, board.name);
    }
  }, [tasks, logActivity]);

  const addColumn = useCallback((boardId: string, name: string, taskLimit?: number): KanbanColumn | undefined => {
    const board = boardService.getById(boardId);
    if (!board) return undefined;
    const column = boardService.addColumn(boardId, { name, position: board.columns.length, taskLimit });
    setBoards(boardService.getAll());
    return column;
  }, []);

  const updateColumn = useCallback((boardId: string, columnId: string, updates: Partial<KanbanColumn>) => {
    boardService.updateColumn(boardId, columnId, updates);
    setBoards(boardService.getAll());
  }, []);

  const deleteColumn = useCallback((boardId: string, columnId: string) => {
    boardService.deleteColumn(boardId, columnId);
    setBoards(boardService.getAll());
    setTasks(tasks.filter(t => t.columnId !== columnId));
  }, [tasks]);

  const reorderColumns = useCallback((boardId: string, columnIds: string[]) => {
    boardService.reorderColumns(boardId, columnIds);
    setBoards(boardService.getAll());
  }, []);

  // ============ TASKS ============
  const loadTasks = useCallback((boardId: string) => {
    setTasks(taskService.getByBoard(boardId));
  }, []);

  const createTask = useCallback((task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>): KanbanTask => {
    const newTask = taskService.create(task);
    setTasks(prev => [...prev, newTask]);
    logActivity('created task', 'task', newTask.id, newTask.title);
    return newTask;
  }, [logActivity]);

  const updateTask = useCallback((id: string, updates: Partial<KanbanTask>) => {
    taskService.update(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    const task = taskService.getById(id);
    if (task) {
      taskService.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      logActivity('deleted task', 'task', id, task.title);
    }
  }, [logActivity]);

  const moveTask = useCallback((taskId: string, columnId: string, position: number) => {
    taskService.moveTask(taskId, columnId, position);
    setTasks(taskService.getByBoard(tasks.find(t => t.id === taskId)?.boardId || ''));
  }, [tasks]);

  const addTaskComment = useCallback((taskId: string, content: string) => {
    if (!user) return;
    taskService.addComment(taskId, {
      authorId: user.id,
      authorName: user.name,
      content,
    });
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return taskService.getById(taskId) || t;
      }
      return t;
    }));
  }, [user]);

  // ============ VISUAL WORKFLOWS ============
  const loadWorkflows = useCallback(() => {
    setWorkflows(workflowService.getAll());
  }, []);

  const createWorkflow = useCallback((name: string, description?: string): VisualWorkflow => {
    const startNode: WorkflowNode = {
      id: generateId('node'),
      type: 'start',
      position: { x: 250, y: 50 },
      data: { label: 'Start' },
    };
    const newWorkflow = workflowService.create({
      name,
      description: description || '',
      nodes: [startNode],
      edges: [],
      createdBy: user?.id || '',
      sharedWith: [],
      isPublic: false,
      status: 'draft',
    });
    setWorkflows(workflowService.getAll());
    logActivity('created', 'workflow', newWorkflow.id, newWorkflow.name);
    return newWorkflow;
  }, [user, logActivity]);

  const updateWorkflow = useCallback((id: string, updates: Partial<VisualWorkflow>) => {
    workflowService.update(id, updates);
    setWorkflows(workflowService.getAll());
  }, []);

  const deleteWorkflow = useCallback((id: string) => {
    const workflow = workflowService.getById(id);
    if (workflow) {
      workflowService.delete(id);
      setWorkflows(workflowService.getAll());
      logActivity('deleted', 'workflow', id, workflow.name);
    }
  }, [logActivity]);

  const saveWorkflowNodes = useCallback((workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    workflowService.update(workflowId, { nodes, edges });
    setWorkflows(workflowService.getAll());
  }, []);

  // ============ ROADMAPS ============
  const loadRoadmaps = useCallback(() => {
    setRoadmaps(roadmapService.getAll());
  }, []);

  const createRoadmap = useCallback((name: string, description?: string): Roadmap => {
    const newRoadmap = roadmapService.create({
      name,
      description,
      items: [],
      milestones: [],
      createdBy: user?.id || '',
      members: user ? [user.id] : [],
      isArchived: false,
    });
    setRoadmaps(roadmapService.getAll());
    logActivity('created', 'roadmap', newRoadmap.id, newRoadmap.name);
    return newRoadmap;
  }, [user, logActivity]);

  const updateRoadmap = useCallback((id: string, updates: Partial<Roadmap>) => {
    roadmapService.update(id, updates);
    setRoadmaps(roadmapService.getAll());
  }, []);

  const deleteRoadmap = useCallback((id: string) => {
    const roadmap = roadmapService.getById(id);
    if (roadmap) {
      roadmapService.delete(id);
      setRoadmaps(roadmapService.getAll());
      logActivity('deleted', 'roadmap', id, roadmap.name);
    }
  }, [logActivity]);

  const addRoadmapItem = useCallback((roadmapId: string, item: Omit<RoadmapItem, 'id' | 'roadmapId'>): RoadmapItem | undefined => {
    const newItem = roadmapService.addItem(roadmapId, item);
    setRoadmaps(roadmapService.getAll());
    return newItem;
  }, []);

  const updateRoadmapItem = useCallback((roadmapId: string, itemId: string, updates: Partial<RoadmapItem>) => {
    roadmapService.updateItem(roadmapId, itemId, updates);
    setRoadmaps(roadmapService.getAll());
  }, []);

  const deleteRoadmapItem = useCallback((roadmapId: string, itemId: string) => {
    roadmapService.deleteItem(roadmapId, itemId);
    setRoadmaps(roadmapService.getAll());
  }, []);

  const addMilestone = useCallback((roadmapId: string, milestone: Omit<Milestone, 'id' | 'roadmapId'>): Milestone | undefined => {
    const newMilestone = roadmapService.addMilestone(roadmapId, milestone);
    setRoadmaps(roadmapService.getAll());
    return newMilestone;
  }, []);

  // ============ PROJECTS & SPRINTS ============
  const loadProjects = useCallback(() => {
    setProjects(projectService.getAll());
  }, []);

  const createProject = useCallback((name: string, key: string, description?: string): Project => {
    const newProject = projectService.create({
      name,
      key: key.toUpperCase(),
      description,
      createdBy: user?.id || '',
      members: user ? [user.id] : [],
      isArchived: false,
    });
    setProjects(projectService.getAll());
    logActivity('created', 'project', newProject.id, newProject.name);
    return newProject;
  }, [user, logActivity]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    projectService.update(id, updates);
    setProjects(projectService.getAll());
  }, []);

  const deleteProject = useCallback((id: string) => {
    const project = projectService.getById(id);
    if (project) {
      projectService.delete(id);
      setProjects(projectService.getAll());
      setBacklogItems(prev => prev.filter(i => i.projectId !== id));
      logActivity('deleted', 'project', id, project.name);
    }
  }, [logActivity]);

  const createSprint = useCallback((projectId: string, sprint: Omit<Sprint, 'id' | 'projectId' | 'items'>): Sprint | undefined => {
    const newSprint = projectService.createSprint(projectId, sprint);
    setProjects(projectService.getAll());
    if (newSprint) {
      logActivity('created sprint', 'sprint', newSprint.id, newSprint.name);
    }
    return newSprint;
  }, [logActivity]);

  const updateSprint = useCallback((projectId: string, sprintId: string, updates: Partial<Sprint>) => {
    projectService.updateSprint(projectId, sprintId, updates);
    setProjects(projectService.getAll());
  }, []);

  const startSprint = useCallback((projectId: string, sprintId: string) => {
    projectService.startSprint(projectId, sprintId);
    setProjects(projectService.getAll());
    const project = projectService.getById(projectId);
    const sprint = project?.sprints.find(s => s.id === sprintId);
    if (sprint) {
      logActivity('started sprint', 'sprint', sprintId, sprint.name);
    }
  }, [logActivity]);

  const completeSprint = useCallback((projectId: string, sprintId: string) => {
    projectService.completeSprint(projectId, sprintId);
    setProjects(projectService.getAll());
    const project = projectService.getById(projectId);
    const sprint = project?.sprints.find(s => s.id === sprintId);
    if (sprint) {
      logActivity('completed sprint', 'sprint', sprintId, sprint.name);
    }
  }, [logActivity]);

  // ============ BACKLOG ============
  const loadBacklogItems = useCallback((projectId: string) => {
    setBacklogItems(backlogService.getByProject(projectId));
  }, []);

  const createBacklogItem = useCallback((item: Omit<BacklogItem, 'id' | 'createdAt' | 'updatedAt'>): BacklogItem => {
    const newItem = backlogService.create(item);
    setBacklogItems(prev => [...prev, newItem]);
    logActivity('created', 'backlog_item', newItem.id, newItem.title);
    return newItem;
  }, [logActivity]);

  const updateBacklogItem = useCallback((id: string, updates: Partial<BacklogItem>) => {
    backlogService.update(id, updates);
    setBacklogItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
  }, []);

  const deleteBacklogItem = useCallback((id: string) => {
    const item = backlogService.getById(id);
    if (item) {
      backlogService.delete(id);
      setBacklogItems(prev => prev.filter(i => i.id !== id));
      logActivity('deleted', 'backlog_item', id, item.title);
    }
  }, [logActivity]);

  const moveItemToSprint = useCallback((itemId: string, sprintId: string) => {
    backlogService.moveToSprint(itemId, sprintId);
    setBacklogItems(prev => prev.map(i => i.id === itemId ? { ...i, sprintId, status: 'in_sprint' } : i));
  }, []);

  const removeItemFromSprint = useCallback((itemId: string) => {
    backlogService.removeFromSprint(itemId);
    setBacklogItems(prev => prev.map(i => i.id === itemId ? { ...i, sprintId: undefined, status: 'ready' } : i));
  }, []);

  // ============ TEAM ============
  const loadTeamMembers = useCallback(() => {
    setTeamMembers(teamService.getAll());
  }, []);

  const addTeamMember = useCallback((member: Omit<TeamMember, 'id' | 'joinedAt'>): TeamMember => {
    const newMember = teamService.add(member);
    setTeamMembers(teamService.getAll());
    logActivity('invited', 'board', newMember.id, newMember.name, 'to the team');
    return newMember;
  }, [logActivity]);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    teamService.update(id, updates);
    setTeamMembers(teamService.getAll());
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    const member = teamService.getById(id);
    if (member) {
      teamService.remove(id);
      setTeamMembers(teamService.getAll());
      logActivity('removed', 'board', id, member.name, 'from the team');
    }
  }, [logActivity]);

  return (
    <CollaborationContext.Provider
      value={{
        // Boards
        boards,
        tasks,
        loadBoards,
        createBoard,
        updateBoard,
        deleteBoard,
        addColumn,
        updateColumn,
        deleteColumn,
        reorderColumns,

        // Tasks
        loadTasks,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        addTaskComment,

        // Workflows
        workflows,
        loadWorkflows,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        saveWorkflowNodes,

        // Roadmaps
        roadmaps,
        loadRoadmaps,
        createRoadmap,
        updateRoadmap,
        deleteRoadmap,
        addRoadmapItem,
        updateRoadmapItem,
        deleteRoadmapItem,
        addMilestone,

        // Projects
        projects,
        backlogItems,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        createSprint,
        updateSprint,
        startSprint,
        completeSprint,

        // Backlog
        loadBacklogItems,
        createBacklogItem,
        updateBacklogItem,
        deleteBacklogItem,
        moveItemToSprint,
        removeItemFromSprint,

        // Team
        teamMembers,
        loadTeamMembers,
        addTeamMember,
        updateTeamMember,
        removeTeamMember,

        isLoading,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }
  return context;
}
