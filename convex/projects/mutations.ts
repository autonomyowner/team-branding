// @ts-nocheck
/* eslint-disable */
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    key: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { workspaceId, name, description, key, userId }) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      throw new Error("Project key already exists");
    }

    const projectId = await ctx.db.insert("projects", {
      workspaceId,
      name,
      description,
      key: key.toUpperCase(),
      createdBy: userId,
      isArchived: false,
    });

    await ctx.db.insert("canvasData", {
      projectId,
      nodes: [],
      containers: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      version: 1,
    });

    return projectId;
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, description }) => {
    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    await ctx.db.patch(projectId, updates);
    return await ctx.db.get(projectId);
  },
});

export const archive = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await ctx.db.patch(projectId, { isArchived: true });
  },
});
