// @ts-nocheck
/* eslint-disable */
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!canvas) {
      return {
        projectId,
        nodes: [],
        containers: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 0,
      };
    }

    return canvas;
  },
});

export const exists = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const canvas = await ctx.db
      .query("canvasData")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    return canvas !== null;
  },
});
