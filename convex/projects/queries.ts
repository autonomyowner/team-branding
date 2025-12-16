// @ts-nocheck
/* eslint-disable */
import { query } from "../_generated/server";
import { v } from "convex/values";

export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    return projects;
  },
});

export const getById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db.get(projectId);
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});
