// @ts-nocheck
/* eslint-disable */
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, { name, slug, description, userId }) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error("Workspace slug already taken");
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      name,
      slug,
      description,
      createdBy: userId,
      isArchived: false,
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return workspaceId;
  },
});

export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, name, description }) => {
    const updates: any = {};
    if (name) updates.name = name;
    if (description) updates.description = description;

    await ctx.db.patch(workspaceId, updates);
    return await ctx.db.get(workspaceId);
  },
});

export const addMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, { workspaceId, userId, role }) => {
    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role });
      return existing._id;
    }

    return await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role,
      joinedAt: Date.now(),
    });
  },
});

export const removeMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, { workspaceId, userId }) => {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .first();

    if (membership) {
      if (membership.role === "owner") {
        throw new Error("Cannot remove workspace owner");
      }
      await ctx.db.delete(membership._id);
    }
  },
});

export const archive = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await ctx.db.patch(workspaceId, { isArchived: true });
  },
});
