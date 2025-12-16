import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const initialize = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    phases: v.array(
      v.object({
        id: v.string(),
        number: v.string(),
        title: v.string(),
        titleAr: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("in_progress"),
          v.literal("complete")
        ),
        tasks: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
            textAr: v.string(),
            owner: v.string(),
            completed: v.boolean(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, { workspaceId, phases }) => {
    // Check if already exists
    const existing = await ctx.db
      .query("teamWorkflowPhases")
      .filter((q) =>
        workspaceId
          ? q.eq(q.field("workspaceId"), workspaceId)
          : q.eq(q.field("workspaceId"), undefined)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new workflow
    const id = await ctx.db.insert("teamWorkflowPhases", {
      workspaceId,
      phases,
      version: 1,
    });

    return id;
  },
});

export const updatePhases = mutation({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
    phases: v.array(
      v.object({
        id: v.string(),
        number: v.string(),
        title: v.string(),
        titleAr: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("in_progress"),
          v.literal("complete")
        ),
        tasks: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
            textAr: v.string(),
            owner: v.string(),
            completed: v.boolean(),
          })
        ),
      })
    ),
    editedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workflowId, phases, editedBy }) => {
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    await ctx.db.patch(workflowId, {
      phases,
      lastEditedBy: editedBy,
      version: workflow.version + 1,
    });

    return workflowId;
  },
});

export const updateTaskStatus = mutation({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
    phaseId: v.string(),
    taskId: v.string(),
    completed: v.boolean(),
    editedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workflowId, phaseId, taskId, completed, editedBy }) => {
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const updatedPhases = workflow.phases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map((task) =>
            task.id === taskId ? { ...task, completed } : task
          ),
        };
      }
      return phase;
    });

    await ctx.db.patch(workflowId, {
      phases: updatedPhases,
      lastEditedBy: editedBy,
      version: workflow.version + 1,
    });

    return workflowId;
  },
});

export const updatePhaseStatus = mutation({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
    phaseId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("complete")
    ),
    editedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workflowId, phaseId, status, editedBy }) => {
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const updatedPhases = workflow.phases.map((phase) =>
      phase.id === phaseId ? { ...phase, status } : phase
    );

    await ctx.db.patch(workflowId, {
      phases: updatedPhases,
      lastEditedBy: editedBy,
      version: workflow.version + 1,
    });

    return workflowId;
  },
});

export const addTask = mutation({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
    phaseId: v.string(),
    task: v.object({
      text: v.string(),
      textAr: v.string(),
      owner: v.string(),
    }),
    editedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workflowId, phaseId, task, editedBy }) => {
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const taskId = `t${Date.now()}`;
    const newTask = {
      id: taskId,
      text: task.text,
      textAr: task.textAr,
      owner: task.owner,
      completed: false,
    };

    const updatedPhases = workflow.phases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: [...phase.tasks, newTask],
        };
      }
      return phase;
    });

    await ctx.db.patch(workflowId, {
      phases: updatedPhases,
      lastEditedBy: editedBy,
      version: workflow.version + 1,
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
    phaseId: v.string(),
    taskId: v.string(),
    updates: v.object({
      text: v.optional(v.string()),
      textAr: v.optional(v.string()),
      owner: v.optional(v.string()),
    }),
    editedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workflowId, phaseId, taskId, updates, editedBy }) => {
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const updatedPhases = workflow.phases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...(updates.text !== undefined && { text: updates.text }),
                  ...(updates.textAr !== undefined && { textAr: updates.textAr }),
                  ...(updates.owner !== undefined && { owner: updates.owner }),
                }
              : task
          ),
        };
      }
      return phase;
    });

    await ctx.db.patch(workflowId, {
      phases: updatedPhases,
      lastEditedBy: editedBy,
      version: workflow.version + 1,
    });

    return workflowId;
  },
});

export const deleteTask = mutation({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
    phaseId: v.string(),
    taskId: v.string(),
    editedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workflowId, phaseId, taskId, editedBy }) => {
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const updatedPhases = workflow.phases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.filter((task) => task.id !== taskId),
        };
      }
      return phase;
    });

    await ctx.db.patch(workflowId, {
      phases: updatedPhases,
      lastEditedBy: editedBy,
      version: workflow.version + 1,
    });

    return workflowId;
  },
});
