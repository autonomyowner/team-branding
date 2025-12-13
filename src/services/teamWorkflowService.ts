import { nanoid } from 'nanoid';
import {
  TeamWorkflowProject,
  ProjectMember,
  ProjectActivity,
  TeamWorkflow,
  EnhancedWorkflowNode,
  EnhancedWorkflowEdge,
  WorkflowContainer,
  Page,
  Block,
  UserPresence,
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

// Generate a random project code
const generateProjectCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ============ TEAM WORKFLOW PROJECTS ============
export const teamProjectService = {
  getAll: (): TeamWorkflowProject[] => getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS),

  getById: (id: string): TeamWorkflowProject | undefined => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    return projects.find((p) => p.id === id);
  },

  getByCode: (code: string): TeamWorkflowProject | undefined => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    return projects.find((p) => p.code.toUpperCase() === code.toUpperCase());
  },

  create: (
    project: Omit<TeamWorkflowProject, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'workflows' | 'pages'>
  ): TeamWorkflowProject => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const newProject: TeamWorkflowProject = {
      ...project,
      id: generateId('twp'),
      code: generateProjectCode(),
      workflows: [],
      pages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(newProject);
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    return newProject;
  },

  update: (id: string, updates: Partial<TeamWorkflowProject>): TeamWorkflowProject | undefined => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    return projects[index];
  },

  delete: (id: string): boolean => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, filtered);

    // Also delete associated workflows and pages
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows.filter((w) => w.projectId !== id));

    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    setToStorage(STORAGE_KEYS.PAGES, pages.filter((p) => p.projectId !== id));

    const activities = getFromStorage<ProjectActivity>(STORAGE_KEYS.PROJECT_ACTIVITY);
    setToStorage(STORAGE_KEYS.PROJECT_ACTIVITY, activities.filter((a) => a.projectId !== id));

    return true;
  },

  // Member management
  addMember: (projectId: string, member: ProjectMember): boolean => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) return false;

    // Check if member already exists
    if (projects[index].members.some((m) => m.userId === member.userId)) {
      return false;
    }

    projects[index].members.push(member);
    projects[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    return true;
  },

  updateMember: (projectId: string, userId: string, updates: Partial<ProjectMember>): boolean => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return false;

    const memberIndex = projects[projIndex].members.findIndex((m) => m.userId === userId);
    if (memberIndex === -1) return false;

    projects[projIndex].members[memberIndex] = { ...projects[projIndex].members[memberIndex], ...updates };
    projects[projIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    return true;
  },

  removeMember: (projectId: string, userId: string): boolean => {
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) return false;

    const originalLength = projects[index].members.length;
    projects[index].members = projects[index].members.filter((m) => m.userId !== userId);

    if (projects[index].members.length === originalLength) return false;

    projects[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    return true;
  },

  // Join project by code
  joinByCode: (code: string, member: ProjectMember): TeamWorkflowProject | undefined => {
    const project = teamProjectService.getByCode(code);
    if (!project) return undefined;

    // Check if already a member
    if (project.members.some((m) => m.userId === member.userId)) {
      return project;
    }

    teamProjectService.addMember(project.id, member);
    return teamProjectService.getById(project.id);
  },
};

// ============ TEAM WORKFLOWS ============
export const teamWorkflowService = {
  getAll: (): TeamWorkflow[] => getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS),

  getByProject: (projectId: string): TeamWorkflow[] => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    return workflows.filter((w) => w.projectId === projectId);
  },

  getById: (id: string): TeamWorkflow | undefined => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    return workflows.find((w) => w.id === id);
  },

  create: (workflow: Omit<TeamWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>): TeamWorkflow => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const newWorkflow: TeamWorkflow = {
      ...workflow,
      id: generateId('twf'),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workflows.push(newWorkflow);
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);

    // Add workflow to project
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === workflow.projectId);
    if (projIndex !== -1) {
      projects[projIndex].workflows.push(newWorkflow.id);
      projects[projIndex].updatedAt = new Date().toISOString();
      setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    }

    return newWorkflow;
  },

  update: (id: string, updates: Partial<TeamWorkflow>): TeamWorkflow | undefined => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === id);
    if (index === -1) return undefined;

    workflows[index] = {
      ...workflows[index],
      ...updates,
      version: workflows[index].version + 1,
      updatedAt: new Date().toISOString(),
    };
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return workflows[index];
  },

  delete: (id: string): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) return false;

    const filtered = workflows.filter((w) => w.id !== id);
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, filtered);

    // Remove from project
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === workflow.projectId);
    if (projIndex !== -1) {
      projects[projIndex].workflows = projects[projIndex].workflows.filter((wId) => wId !== id);
      projects[projIndex].updatedAt = new Date().toISOString();
      setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    }

    return true;
  },

  // Node operations
  addNode: (workflowId: string, node: EnhancedWorkflowNode): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    workflows[index].nodes.push(node);
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  updateNode: (workflowId: string, nodeId: string, updates: Partial<EnhancedWorkflowNode>): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const wfIndex = workflows.findIndex((w) => w.id === workflowId);
    if (wfIndex === -1) return false;

    const nodeIndex = workflows[wfIndex].nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return false;

    workflows[wfIndex].nodes[nodeIndex] = { ...workflows[wfIndex].nodes[nodeIndex], ...updates };
    workflows[wfIndex].version++;
    workflows[wfIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  deleteNode: (workflowId: string, nodeId: string): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    workflows[index].nodes = workflows[index].nodes.filter((n) => n.id !== nodeId);
    // Also remove edges connected to this node
    workflows[index].edges = workflows[index].edges.filter(
      (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
    );
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  // Edge operations
  addEdge: (workflowId: string, edge: EnhancedWorkflowEdge): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    workflows[index].edges.push(edge);
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  deleteEdge: (workflowId: string, edgeId: string): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    workflows[index].edges = workflows[index].edges.filter((e) => e.id !== edgeId);
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  // Container operations
  addContainer: (workflowId: string, container: WorkflowContainer): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    if (!workflows[index].containers) {
      workflows[index].containers = [];
    }
    workflows[index].containers.push(container);
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  updateContainer: (workflowId: string, containerId: string, updates: Partial<WorkflowContainer>): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const wfIndex = workflows.findIndex((w) => w.id === workflowId);
    if (wfIndex === -1) return false;

    if (!workflows[wfIndex].containers) return false;
    const containerIndex = workflows[wfIndex].containers.findIndex((c) => c.id === containerId);
    if (containerIndex === -1) return false;

    workflows[wfIndex].containers[containerIndex] = { ...workflows[wfIndex].containers[containerIndex], ...updates };
    workflows[wfIndex].version++;
    workflows[wfIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  deleteContainer: (workflowId: string, containerId: string): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    if (!workflows[index].containers) return false;
    workflows[index].containers = workflows[index].containers.filter((c) => c.id !== containerId);
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },

  // Save entire workflow state
  saveWorkflow: (
    workflowId: string,
    nodes: EnhancedWorkflowNode[],
    edges: EnhancedWorkflowEdge[],
    containers: WorkflowContainer[],
    viewport: { x: number; y: number; zoom: number }
  ): boolean => {
    const workflows = getFromStorage<TeamWorkflow>(STORAGE_KEYS.TEAM_WORKFLOWS);
    const index = workflows.findIndex((w) => w.id === workflowId);
    if (index === -1) return false;

    workflows[index].nodes = nodes;
    workflows[index].edges = edges;
    workflows[index].containers = containers;
    workflows[index].viewport = viewport;
    workflows[index].version++;
    workflows[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TEAM_WORKFLOWS, workflows);
    return true;
  },
};

// ============ PAGES ============
export const pageService = {
  getAll: (): Page[] => getFromStorage<Page>(STORAGE_KEYS.PAGES),

  getByProject: (projectId: string): Page[] => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    return pages.filter((p) => p.projectId === projectId && !p.isArchived);
  },

  getById: (id: string): Page | undefined => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    return pages.find((p) => p.id === id);
  },

  getRootPages: (projectId: string): Page[] => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    return pages.filter((p) => p.projectId === projectId && !p.parentPageId && !p.isArchived);
  },

  getChildPages: (parentPageId: string): Page[] => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    return pages.filter((p) => p.parentPageId === parentPageId && !p.isArchived);
  },

  create: (page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Page => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const newPage: Page = {
      ...page,
      id: generateId('page'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pages.push(newPage);
    setToStorage(STORAGE_KEYS.PAGES, pages);

    // Add page to project
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === page.projectId);
    if (projIndex !== -1) {
      projects[projIndex].pages.push(newPage.id);
      projects[projIndex].updatedAt = new Date().toISOString();
      setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    }

    // If has parent, update parent's childPageIds
    if (page.parentPageId) {
      const parentIndex = pages.findIndex((p) => p.id === page.parentPageId);
      if (parentIndex !== -1) {
        pages[parentIndex].childPageIds = [...(pages[parentIndex].childPageIds || []), newPage.id];
        setToStorage(STORAGE_KEYS.PAGES, pages);
      }
    }

    return newPage;
  },

  update: (id: string, updates: Partial<Page>): Page | undefined => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const index = pages.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    pages[index] = { ...pages[index], ...updates, updatedAt: new Date().toISOString() };
    setToStorage(STORAGE_KEYS.PAGES, pages);
    return pages[index];
  },

  delete: (id: string): boolean => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const page = pages.find((p) => p.id === id);
    if (!page) return false;

    // Archive instead of hard delete
    const index = pages.findIndex((p) => p.id === id);
    pages[index].isArchived = true;
    pages[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PAGES, pages);

    // Remove from project
    const projects = getFromStorage<TeamWorkflowProject>(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS);
    const projIndex = projects.findIndex((p) => p.id === page.projectId);
    if (projIndex !== -1) {
      projects[projIndex].pages = projects[projIndex].pages.filter((pId) => pId !== id);
      projects[projIndex].updatedAt = new Date().toISOString();
      setToStorage(STORAGE_KEYS.TEAM_WORKFLOW_PROJECTS, projects);
    }

    return true;
  },

  // Block operations
  updateBlocks: (pageId: string, blocks: Block[]): boolean => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const index = pages.findIndex((p) => p.id === pageId);
    if (index === -1) return false;

    pages[index].blocks = blocks;
    pages[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PAGES, pages);
    return true;
  },

  addBlock: (pageId: string, block: Block, afterBlockId?: string): boolean => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const index = pages.findIndex((p) => p.id === pageId);
    if (index === -1) return false;

    if (afterBlockId) {
      const afterIndex = pages[index].blocks.findIndex((b) => b.id === afterBlockId);
      if (afterIndex !== -1) {
        pages[index].blocks.splice(afterIndex + 1, 0, block);
        // Update positions
        pages[index].blocks.forEach((b, i) => (b.position = i));
      } else {
        pages[index].blocks.push(block);
      }
    } else {
      pages[index].blocks.push(block);
    }

    pages[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PAGES, pages);
    return true;
  },

  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>): boolean => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return false;

    const blockIndex = pages[pageIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return false;

    pages[pageIndex].blocks[blockIndex] = { ...pages[pageIndex].blocks[blockIndex], ...updates };
    pages[pageIndex].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PAGES, pages);
    return true;
  },

  deleteBlock: (pageId: string, blockId: string): boolean => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const index = pages.findIndex((p) => p.id === pageId);
    if (index === -1) return false;

    pages[index].blocks = pages[index].blocks.filter((b) => b.id !== blockId);
    // Update positions
    pages[index].blocks.forEach((b, i) => (b.position = i));
    pages[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PAGES, pages);
    return true;
  },

  reorderBlocks: (pageId: string, blockIds: string[]): boolean => {
    const pages = getFromStorage<Page>(STORAGE_KEYS.PAGES);
    const index = pages.findIndex((p) => p.id === pageId);
    if (index === -1) return false;

    const blockMap = new Map(pages[index].blocks.map((b) => [b.id, b]));
    pages[index].blocks = blockIds
      .map((id, pos) => {
        const block = blockMap.get(id);
        return block ? { ...block, position: pos } : null;
      })
      .filter((b): b is Block => b !== null);

    pages[index].updatedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.PAGES, pages);
    return true;
  },
};

// ============ PROJECT ACTIVITY ============
export const projectActivityService = {
  getByProject: (projectId: string, limit = 50): ProjectActivity[] => {
    const activities = getFromStorage<ProjectActivity>(STORAGE_KEYS.PROJECT_ACTIVITY);
    return activities
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  create: (activity: Omit<ProjectActivity, 'id' | 'createdAt'>): ProjectActivity => {
    const activities = getFromStorage<ProjectActivity>(STORAGE_KEYS.PROJECT_ACTIVITY);
    const newActivity: ProjectActivity = {
      ...activity,
      id: generateId('pact'),
      createdAt: new Date().toISOString(),
    };
    activities.push(newActivity);

    // Keep only last 200 activities per project
    const projectActivities = activities.filter((a) => a.projectId === activity.projectId);
    if (projectActivities.length > 200) {
      projectActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const idsToKeep = new Set(projectActivities.slice(0, 200).map((a) => a.id));
      const filtered = activities.filter(
        (a) => a.projectId !== activity.projectId || idsToKeep.has(a.id)
      );
      setToStorage(STORAGE_KEYS.PROJECT_ACTIVITY, filtered);
    } else {
      setToStorage(STORAGE_KEYS.PROJECT_ACTIVITY, activities);
    }

    return newActivity;
  },
};

// ============ PRESENCE SIMULATION ============
const PRESENCE_COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#96CEB4', // green
  '#FFEAA7', // yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // gold
];

const PHANTOM_NAMES = [
  'Alex Chen',
  'Jordan Smith',
  'Taylor Lee',
  'Morgan Davis',
  'Casey Wilson',
  'Riley Thompson',
  'Avery Brown',
  'Quinn Martinez',
];

export const presenceService = {
  getByProject: (projectId: string): UserPresence[] => {
    const presences = getFromStorage<UserPresence>(STORAGE_KEYS.USER_PRESENCE);
    return presences.filter((p) => {
      // Check if presence is for this project and not stale (last 30 seconds)
      const lastActive = new Date(p.lastActiveAt).getTime();
      const now = Date.now();
      return now - lastActive < 30000;
    });
  },

  update: (presence: UserPresence): void => {
    const presences = getFromStorage<UserPresence>(STORAGE_KEYS.USER_PRESENCE);
    const index = presences.findIndex((p) => p.id === presence.id);
    if (index !== -1) {
      presences[index] = presence;
    } else {
      presences.push(presence);
    }
    setToStorage(STORAGE_KEYS.USER_PRESENCE, presences);
  },

  remove: (presenceId: string): void => {
    const presences = getFromStorage<UserPresence>(STORAGE_KEYS.USER_PRESENCE);
    setToStorage(
      STORAGE_KEYS.USER_PRESENCE,
      presences.filter((p) => p.id !== presenceId)
    );
  },

  // Generate simulated phantom users for demo purposes
  generatePhantomPresence: (projectId: string, pageId?: string, workflowId?: string): UserPresence[] => {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 phantom users
    const phantoms: UserPresence[] = [];

    for (let i = 0; i < count; i++) {
      const phantom: UserPresence = {
        id: generateId('presence'),
        userId: generateId('phantom'),
        userName: PHANTOM_NAMES[Math.floor(Math.random() * PHANTOM_NAMES.length)],
        color: PRESENCE_COLORS[i % PRESENCE_COLORS.length],
        pageId,
        workflowId,
        cursorPosition: {
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
        },
        lastActiveAt: new Date().toISOString(),
        status: 'active',
      };
      phantoms.push(phantom);
    }

    return phantoms;
  },

  // Simulate cursor movement for phantoms
  simulateCursorMovement: (presence: UserPresence): UserPresence => {
    return {
      ...presence,
      cursorPosition: {
        x: (presence.cursorPosition?.x || 400) + (Math.random() - 0.5) * 100,
        y: (presence.cursorPosition?.y || 300) + (Math.random() - 0.5) * 100,
      },
      lastActiveAt: new Date().toISOString(),
    };
  },

  // Clear stale presences
  clearStale: (): void => {
    const presences = getFromStorage<UserPresence>(STORAGE_KEYS.USER_PRESENCE);
    const now = Date.now();
    const filtered = presences.filter((p) => {
      const lastActive = new Date(p.lastActiveAt).getTime();
      return now - lastActive < 30000;
    });
    setToStorage(STORAGE_KEYS.USER_PRESENCE, filtered);
  },
};
