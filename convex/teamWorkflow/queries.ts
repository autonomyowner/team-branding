import { query } from "../_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, { workspaceId }) => {
    const workflow = await ctx.db
      .query("teamWorkflowPhases")
      .filter((q) =>
        workspaceId
          ? q.eq(q.field("workspaceId"), workspaceId)
          : q.eq(q.field("workspaceId"), undefined)
      )
      .first();

    return workflow;
  },
});

export const getById = query({
  args: {
    workflowId: v.id("teamWorkflowPhases"),
  },
  handler: async (ctx, { workflowId }) => {
    return await ctx.db.get(workflowId);
  },
});
