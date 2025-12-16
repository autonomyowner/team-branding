// @ts-nocheck
/* eslint-disable */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_ROOM = "team-canvas";

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

// ============ QUERIES ============

// Get the shared canvas (creates one if it doesn't exist)
export const get = query({
  args: { roomId: v.optional(v.string()) },
  handler: async (ctx, { roomId }) => {
    const room = roomId || DEFAULT_ROOM;

    const canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (!canvas) {
      // Return default empty state (will be created on first mutation)
      return {
        roomId: room,
        nodes: [],
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 0,
        _id: null,
        lastEditedBy: undefined,
      };
    }

    return canvas;
  },
});

// ============ MUTATIONS ============

// Initialize the shared canvas
export const init = mutation({
  args: { roomId: v.optional(v.string()) },
  handler: async (ctx, { roomId }) => {
    const room = roomId || DEFAULT_ROOM;

    const existing = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (existing) {
      return existing._id;
    }

    const canvasId = await ctx.db.insert("sharedCanvas", {
      roomId: room,
      nodes: [],
      containers: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      version: 1,
    });

    return canvasId;
  },
});

// Add a node
export const addNode = mutation({
  args: {
    roomId: v.optional(v.string()),
    node: nodeValidator,
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, node, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    let canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (!canvas) {
      // Create canvas if it doesn't exist
      await ctx.db.insert("sharedCanvas", {
        roomId: room,
        nodes: [node],
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        lastEditedBy: userName,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      nodes: [...canvas.nodes, node],
      version: canvas.version + 1,
      lastEditedBy: userName,
    });
  },
});

// Update a node
export const updateNode = mutation({
  args: {
    roomId: v.optional(v.string()),
    nodeId: v.string(),
    updates: v.object({
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      size: v.optional(v.object({ width: v.number(), height: v.number() })),
      content: v.optional(v.string()),
      color: v.optional(v.string()),
      assignee: v.optional(v.string()),
    }),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, nodeId, updates, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    const canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
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
      lastEditedBy: userName,
    });
  },
});

// Delete a node
export const deleteNode = mutation({
  args: {
    roomId: v.optional(v.string()),
    nodeId: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, nodeId, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    const canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const updatedNodes = canvas.nodes.filter((n) => n.id !== nodeId);

    await ctx.db.patch(canvas._id, {
      nodes: updatedNodes,
      version: canvas.version + 1,
      lastEditedBy: userName,
    });
  },
});

// Add a container
export const addContainer = mutation({
  args: {
    roomId: v.optional(v.string()),
    container: containerValidator,
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, container, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    let canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (!canvas) {
      await ctx.db.insert("sharedCanvas", {
        roomId: room,
        nodes: [],
        containers: [container],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        lastEditedBy: userName,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      containers: [...canvas.containers, container],
      version: canvas.version + 1,
      lastEditedBy: userName,
    });
  },
});

// Update a container
export const updateContainer = mutation({
  args: {
    roomId: v.optional(v.string()),
    containerId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      color: v.optional(v.string()),
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      size: v.optional(v.object({ width: v.number(), height: v.number() })),
    }),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, containerId, updates, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    const canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
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
      lastEditedBy: userName,
    });
  },
});

// Delete a container
export const deleteContainer = mutation({
  args: {
    roomId: v.optional(v.string()),
    containerId: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, containerId, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    const canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
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
      lastEditedBy: userName,
    });
  },
});

// Batch update all nodes (for efficient drag operations)
export const batchUpdateNodes = mutation({
  args: {
    roomId: v.optional(v.string()),
    nodes: v.array(nodeValidator),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, nodes, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    let canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (!canvas) {
      await ctx.db.insert("sharedCanvas", {
        roomId: room,
        nodes,
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        lastEditedBy: userName,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      nodes,
      version: canvas.version + 1,
      lastEditedBy: userName,
    });
  },
});

// Batch update all containers
export const batchUpdateContainers = mutation({
  args: {
    roomId: v.optional(v.string()),
    containers: v.array(containerValidator),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, containers, userName }) => {
    const room = roomId || DEFAULT_ROOM;

    let canvas = await ctx.db
      .query("sharedCanvas")
      .withIndex("by_room", (q) => q.eq("roomId", room))
      .first();

    if (!canvas) {
      await ctx.db.insert("sharedCanvas", {
        roomId: room,
        nodes: [],
        containers,
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        lastEditedBy: userName,
      });
      return;
    }

    await ctx.db.patch(canvas._id, {
      containers,
      version: canvas.version + 1,
      lastEditedBy: userName,
    });
  },
});
