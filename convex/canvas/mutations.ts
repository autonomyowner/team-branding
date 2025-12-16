// @ts-nocheck
/* eslint-disable */
import { mutation } from "../_generated/server";
import { v } from "convex/values";

const nodeValidator = v.object({
  id: v.string(),
  type: v.union(v.literal("task"), v.literal("note"), v.literal("milestone")),
  position: v.object({ x: v.number(), y: v.number() }),
  size: v.object({ width: v.number(), height: v.number() }),
  content: v.string(),
  color: v.string(),
  assignee: v.optional(v.string()),
});

const containerValidator = v.object({
  id: v.string(),
  name: v.string(),
  color: v.string(),
  position: v.object({ x: v.number(), y: v.number() }),
  size: v.object({ width: v.number(), height: v.number() }),
});

export const initCanvas = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const existing = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (existing) {
      return existing._id;
    }

    const canvasId = await ctx.db.insert("canvasData", {
      projectId,
      nodes: [],
      containers: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      version: 1,
    });

    return canvasId;
  },
});

export const addNode = mutation({
  args: {
    projectId: v.id("projects"),
    node: nodeValidator,
  },
  handler: async (ctx, { projectId, node }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      await ctx.db.insert("canvasData", {
        projectId,
        nodes: [node],
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      nodes: [...canvas.nodes, node],
      version: canvas.version + 1,
    });
  },
});

export const updateNode = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    updates: v.object({
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      size: v.optional(v.object({ width: v.number(), height: v.number() })),
      content: v.optional(v.string()),
      color: v.optional(v.string()),
      assignee: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { projectId, nodeId, updates }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const updatedNodes = canvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates } : n
    );

    await ctx.db.patch(canvas._id, {
      nodes: updatedNodes,
      version: canvas.version + 1,
    });
  },
});

export const deleteNode = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
  },
  handler: async (ctx, { projectId, nodeId }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const updatedNodes = canvas.nodes.filter((n) => n.id !== nodeId);

    await ctx.db.patch(canvas._id, {
      nodes: updatedNodes,
      version: canvas.version + 1,
    });
  },
});

export const addContainer = mutation({
  args: {
    projectId: v.id("projects"),
    container: containerValidator,
  },
  handler: async (ctx, { projectId, container }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      await ctx.db.insert("canvasData", {
        projectId,
        nodes: [],
        containers: [container],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      containers: [...canvas.containers, container],
      version: canvas.version + 1,
    });
  },
});

export const updateContainer = mutation({
  args: {
    projectId: v.id("projects"),
    containerId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      color: v.optional(v.string()),
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      size: v.optional(v.object({ width: v.number(), height: v.number() })),
    }),
  },
  handler: async (ctx, { projectId, containerId, updates }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const updatedContainers = canvas.containers.map((c) =>
      c.id === containerId ? { ...c, ...updates } : c
    );

    await ctx.db.patch(canvas._id, {
      containers: updatedContainers,
      version: canvas.version + 1,
    });
  },
});

export const deleteContainer = mutation({
  args: {
    projectId: v.id("projects"),
    containerId: v.string(),
  },
  handler: async (ctx, { projectId, containerId }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const updatedContainers = canvas.containers.filter(
      (c) => c.id !== containerId
    );

    await ctx.db.patch(canvas._id, {
      containers: updatedContainers,
      version: canvas.version + 1,
    });
  },
});

export const updateViewport = mutation({
  args: {
    projectId: v.id("projects"),
    viewport: v.object({
      x: v.number(),
      y: v.number(),
      zoom: v.number(),
    }),
  },
  handler: async (ctx, { projectId, viewport }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      return;
    }

    await ctx.db.patch(canvas._id, { viewport });
  },
});

export const batchUpdateNodes = mutation({
  args: {
    projectId: v.id("projects"),
    nodes: v.array(nodeValidator),
  },
  handler: async (ctx, { projectId, nodes }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      await ctx.db.insert("canvasData", {
        projectId,
        nodes,
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      nodes,
      version: canvas.version + 1,
    });
  },
});
