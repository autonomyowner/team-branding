"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
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
} from "@/types/collaboration";
import {
  teamProjectService,
  teamWorkflowService,
  pageService,
  projectActivityService,
  presenceService,
  generateId,
} from "@/services/teamWorkflowService";
import { useAuth } from "./AuthContext";

interface TeamWorkflowContextType {
  // Projects
  projects: TeamWorkflowProject[];
  currentProject: TeamWorkflowProject | null;
  loadProjects: () => void;
  setCurrentProject: (project: TeamWorkflowProject | null) => void;
  createProject: (name: string, description?: string) => TeamWorkflowProject;
  updateProject: (id: string, updates: Partial<TeamWorkflowProject>) => void;
  deleteProject: (id: string) => void;
  joinProject: (code: string) => TeamWorkflowProject | undefined;

  // Members
  addMember: (projectId: string, member: ProjectMember) => boolean;
  updateMember: (projectId: string, userId: string, updates: Partial<ProjectMember>) => void;
  removeMember: (projectId: string, userId: string) => void;

  // Team Workflows
  workflows: TeamWorkflow[];
  currentWorkflow: TeamWorkflow | null;
  loadWorkflows: (projectId: string) => void;
  setCurrentWorkflow: (workflow: TeamWorkflow | null) => void;
  createWorkflow: (projectId: string, name: string, description?: string) => TeamWorkflow;
  updateWorkflow: (id: string, updates: Partial<TeamWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
  saveWorkflow: (
    workflowId: string,
    nodes: EnhancedWorkflowNode[],
    edges: EnhancedWorkflowEdge[],
    containers: WorkflowContainer[],
    viewport: { x: number; y: number; zoom: number }
  ) => void;

  // Pages
  pages: Page[];
  currentPage: Page | null;
  loadPages: (projectId: string) => void;
  setCurrentPage: (page: Page | null) => void;
  createPage: (projectId: string, title: string, parentPageId?: string) => Page;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  updateBlocks: (pageId: string, blocks: Block[]) => void;
  addBlock: (pageId: string, block: Block, afterBlockId?: string) => void;
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  reorderBlocks: (pageId: string, blockIds: string[]) => void;

  // Activity
  activities: ProjectActivity[];
  loadActivities: (projectId: string) => void;

  // Presence
  presences: UserPresence[];
  phantomPresences: UserPresence[];
  updatePresence: (presence: UserPresence) => void;
  startPresenceSimulation: (projectId: string, pageId?: string, workflowId?: string) => void;
  stopPresenceSimulation: () => void;

  // Loading state
  isLoading: boolean;
}

const TeamWorkflowContext = createContext<TeamWorkflowContextType | undefined>(undefined);

export function TeamWorkflowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [projects, setProjects] = useState<TeamWorkflowProject[]>([]);
  const [currentProject, setCurrentProject] = useState<TeamWorkflowProject | null>(null);
  const [workflows, setWorkflows] = useState<TeamWorkflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<TeamWorkflow | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [phantomPresences, setPhantomPresences] = useState<UserPresence[]>([]);

  // Presence simulation ref
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadProjects();
      setIsLoading(false);
    }
  }, []);

  // Cleanup presence simulation on unmount
  useEffect(() => {
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
  }, []);

  // Log activity helper
  const logActivity = useCallback(
    (
      projectId: string,
      action: ProjectActivity["action"],
      entityType: ProjectActivity["entityType"],
      entityId: string,
      entityName: string,
      details?: string
    ) => {
      if (!user) return;
      projectActivityService.create({
        projectId,
        userId: user.id,
        userName: user.name,
        action,
        entityType,
        entityId,
        entityName,
        details,
      });
    },
    [user]
  );

  // ============ PROJECTS ============
  const loadProjects = useCallback(() => {
    setProjects(teamProjectService.getAll());
  }, []);

  const createProject = useCallback(
    (name: string, description?: string): TeamWorkflowProject => {
      if (!user) throw new Error("User must be logged in to create a project");

      const ownerMember: ProjectMember = {
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: "owner",
        joinedAt: new Date().toISOString(),
      };

      const newProject = teamProjectService.create({
        name,
        description,
        createdBy: user.id,
        members: [ownerMember],
        settings: {
          allowPublicView: false,
          notifyOnChanges: true,
        },
        isArchived: false,
      });

      setProjects(teamProjectService.getAll());
      logActivity(newProject.id, "created", "workflow", newProject.id, newProject.name);
      return newProject;
    },
    [user, logActivity]
  );

  const updateProject = useCallback((id: string, updates: Partial<TeamWorkflowProject>) => {
    teamProjectService.update(id, updates);
    setProjects(teamProjectService.getAll());
    if (currentProject?.id === id) {
      const updated = teamProjectService.getById(id);
      if (updated) setCurrentProject(updated);
    }
  }, [currentProject]);

  const deleteProject = useCallback(
    (id: string) => {
      const project = teamProjectService.getById(id);
      if (project) {
        teamProjectService.delete(id);
        setProjects(teamProjectService.getAll());
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
      }
    },
    [currentProject]
  );

  const joinProject = useCallback(
    (code: string): TeamWorkflowProject | undefined => {
      if (!user) return undefined;

      const member: ProjectMember = {
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: "editor",
        joinedAt: new Date().toISOString(),
      };

      const project = teamProjectService.joinByCode(code, member);
      if (project) {
        setProjects(teamProjectService.getAll());
        logActivity(project.id, "joined", "member", user.id, user.name);
      }
      return project;
    },
    [user, logActivity]
  );

  // ============ MEMBERS ============
  const addMember = useCallback(
    (projectId: string, member: ProjectMember): boolean => {
      const success = teamProjectService.addMember(projectId, member);
      if (success) {
        setProjects(teamProjectService.getAll());
        if (currentProject?.id === projectId) {
          const updated = teamProjectService.getById(projectId);
          if (updated) setCurrentProject(updated);
        }
        logActivity(projectId, "joined", "member", member.userId, member.userName);
      }
      return success;
    },
    [currentProject, logActivity]
  );

  const updateMember = useCallback(
    (projectId: string, userId: string, updates: Partial<ProjectMember>) => {
      teamProjectService.updateMember(projectId, userId, updates);
      setProjects(teamProjectService.getAll());
      if (currentProject?.id === projectId) {
        const updated = teamProjectService.getById(projectId);
        if (updated) setCurrentProject(updated);
      }
    },
    [currentProject]
  );

  const removeMember = useCallback(
    (projectId: string, userId: string) => {
      const project = teamProjectService.getById(projectId);
      const member = project?.members.find((m) => m.userId === userId);
      teamProjectService.removeMember(projectId, userId);
      setProjects(teamProjectService.getAll());
      if (currentProject?.id === projectId) {
        const updated = teamProjectService.getById(projectId);
        if (updated) setCurrentProject(updated);
      }
      if (member) {
        logActivity(projectId, "left", "member", userId, member.userName);
      }
    },
    [currentProject, logActivity]
  );

  // ============ TEAM WORKFLOWS ============
  const loadWorkflows = useCallback((projectId: string) => {
    setWorkflows(teamWorkflowService.getByProject(projectId));
  }, []);

  const createWorkflow = useCallback(
    (projectId: string, name: string, description?: string): TeamWorkflow => {
      if (!user) throw new Error("User must be logged in to create a workflow");

      const triggerNode: EnhancedWorkflowNode = {
        id: generateId("node"),
        type: "trigger",
        position: { x: 250, y: 100 },
        data: {
          label: "Start",
          triggerType: "manual",
        },
        handles: [
          { id: "out-1", type: "source", position: "bottom" },
        ],
      };

      const newWorkflow = teamWorkflowService.create({
        projectId,
        name,
        description,
        nodes: [triggerNode],
        edges: [],
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdBy: user.id,
        status: "draft",
      });

      setWorkflows(teamWorkflowService.getByProject(projectId));
      logActivity(projectId, "created", "workflow", newWorkflow.id, newWorkflow.name);
      return newWorkflow;
    },
    [user, logActivity]
  );

  const updateWorkflow = useCallback(
    (id: string, updates: Partial<TeamWorkflow>) => {
      const updated = teamWorkflowService.update(id, updates);
      if (updated) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? updated : w))
        );
        if (currentWorkflow?.id === id) {
          setCurrentWorkflow(updated);
        }
      }
    },
    [currentWorkflow]
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      const workflow = teamWorkflowService.getById(id);
      if (workflow) {
        teamWorkflowService.delete(id);
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        if (currentWorkflow?.id === id) {
          setCurrentWorkflow(null);
        }
        logActivity(workflow.projectId, "deleted", "workflow", id, workflow.name);
      }
    },
    [currentWorkflow, logActivity]
  );

  const saveWorkflow = useCallback(
    (
      workflowId: string,
      nodes: EnhancedWorkflowNode[],
      edges: EnhancedWorkflowEdge[],
      containers: WorkflowContainer[],
      viewport: { x: number; y: number; zoom: number }
    ) => {
      teamWorkflowService.saveWorkflow(workflowId, nodes, edges, containers, viewport);
      const updated = teamWorkflowService.getById(workflowId);
      if (updated) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflowId ? updated : w))
        );
        if (currentWorkflow?.id === workflowId) {
          setCurrentWorkflow(updated);
        }
        logActivity(updated.projectId, "updated", "workflow", workflowId, updated.name);
      }
    },
    [currentWorkflow, logActivity]
  );

  // ============ PAGES ============
  const loadPages = useCallback((projectId: string) => {
    setPages(pageService.getByProject(projectId));
  }, []);

  const createPage = useCallback(
    (projectId: string, title: string, parentPageId?: string): Page => {
      if (!user) throw new Error("User must be logged in to create a page");

      const initialBlock: Block = {
        id: generateId("block"),
        type: "paragraph",
        content: "",
        position: 0,
      };

      const newPage = pageService.create({
        projectId,
        title,
        blocks: [initialBlock],
        parentPageId,
        createdBy: user.id,
        isArchived: false,
      });

      setPages(pageService.getByProject(projectId));
      logActivity(projectId, "created", "page", newPage.id, newPage.title);
      return newPage;
    },
    [user, logActivity]
  );

  const updatePage = useCallback(
    (id: string, updates: Partial<Page>) => {
      const updated = pageService.update(id, updates);
      if (updated) {
        setPages((prev) => prev.map((p) => (p.id === id ? updated : p)));
        if (currentPage?.id === id) {
          setCurrentPage(updated);
        }
      }
    },
    [currentPage]
  );

  const deletePage = useCallback(
    (id: string) => {
      const page = pageService.getById(id);
      if (page) {
        pageService.delete(id);
        setPages((prev) => prev.filter((p) => p.id !== id));
        if (currentPage?.id === id) {
          setCurrentPage(null);
        }
        logActivity(page.projectId, "deleted", "page", id, page.title);
      }
    },
    [currentPage, logActivity]
  );

  const updateBlocks = useCallback(
    (pageId: string, blocks: Block[]) => {
      pageService.updateBlocks(pageId, blocks);
      const updated = pageService.getById(pageId);
      if (updated) {
        setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
        if (currentPage?.id === pageId) {
          setCurrentPage(updated);
        }
      }
    },
    [currentPage]
  );

  const addBlock = useCallback(
    (pageId: string, block: Block, afterBlockId?: string) => {
      pageService.addBlock(pageId, block, afterBlockId);
      const updated = pageService.getById(pageId);
      if (updated) {
        setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
        if (currentPage?.id === pageId) {
          setCurrentPage(updated);
        }
      }
    },
    [currentPage]
  );

  const updateBlock = useCallback(
    (pageId: string, blockId: string, updates: Partial<Block>) => {
      pageService.updateBlock(pageId, blockId, updates);
      const updated = pageService.getById(pageId);
      if (updated) {
        setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
        if (currentPage?.id === pageId) {
          setCurrentPage(updated);
        }
      }
    },
    [currentPage]
  );

  const deleteBlock = useCallback(
    (pageId: string, blockId: string) => {
      pageService.deleteBlock(pageId, blockId);
      const updated = pageService.getById(pageId);
      if (updated) {
        setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
        if (currentPage?.id === pageId) {
          setCurrentPage(updated);
        }
      }
    },
    [currentPage]
  );

  const reorderBlocks = useCallback(
    (pageId: string, blockIds: string[]) => {
      pageService.reorderBlocks(pageId, blockIds);
      const updated = pageService.getById(pageId);
      if (updated) {
        setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
        if (currentPage?.id === pageId) {
          setCurrentPage(updated);
        }
      }
    },
    [currentPage]
  );

  // ============ ACTIVITY ============
  const loadActivities = useCallback((projectId: string) => {
    setActivities(projectActivityService.getByProject(projectId));
  }, []);

  // ============ PRESENCE ============
  const updatePresence = useCallback((presence: UserPresence) => {
    presenceService.update(presence);
    setPresences((prev) => {
      const index = prev.findIndex((p) => p.id === presence.id);
      if (index !== -1) {
        return prev.map((p) => (p.id === presence.id ? presence : p));
      }
      return [...prev, presence];
    });
  }, []);

  const startPresenceSimulation = useCallback(
    (projectId: string, pageId?: string, workflowId?: string) => {
      // Clear any existing simulation
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }

      // Generate phantom users
      const phantoms = presenceService.generatePhantomPresence(projectId, pageId, workflowId);
      setPhantomPresences(phantoms);

      // Start cursor movement simulation
      presenceIntervalRef.current = setInterval(() => {
        setPhantomPresences((prev) =>
          prev.map((phantom) => {
            // 70% chance to move cursor
            if (Math.random() > 0.3) {
              return presenceService.simulateCursorMovement(phantom);
            }
            return phantom;
          })
        );
      }, 3000 + Math.random() * 4000); // Random interval between 3-7 seconds
    },
    []
  );

  const stopPresenceSimulation = useCallback(() => {
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    setPhantomPresences([]);
  }, []);

  return (
    <TeamWorkflowContext.Provider
      value={{
        // Projects
        projects,
        currentProject,
        loadProjects,
        setCurrentProject,
        createProject,
        updateProject,
        deleteProject,
        joinProject,

        // Members
        addMember,
        updateMember,
        removeMember,

        // Workflows
        workflows,
        currentWorkflow,
        loadWorkflows,
        setCurrentWorkflow,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        saveWorkflow,

        // Pages
        pages,
        currentPage,
        loadPages,
        setCurrentPage,
        createPage,
        updatePage,
        deletePage,
        updateBlocks,
        addBlock,
        updateBlock,
        deleteBlock,
        reorderBlocks,

        // Activity
        activities,
        loadActivities,

        // Presence
        presences,
        phantomPresences,
        updatePresence,
        startPresenceSimulation,
        stopPresenceSimulation,

        isLoading,
      }}
    >
      {children}
    </TeamWorkflowContext.Provider>
  );
}

export function useTeamWorkflow() {
  const context = useContext(TeamWorkflowContext);
  if (context === undefined) {
    throw new Error("useTeamWorkflow must be used within a TeamWorkflowProvider");
  }
  return context;
}
