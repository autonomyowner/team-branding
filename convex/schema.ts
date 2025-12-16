import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // ============ AUTH TABLES (Convex Auth) ============
  ...authTables,

  // ============ USERS ============
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    // Convex Auth adds: image, emailVerified, etc.
  })
    .index("by_email", ["email"]),

  // ============ WORKSPACES ============
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    isArchived: v.boolean(),
  }).index("by_slug", ["slug"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
    joinedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // ============ PROJECTS ============
  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    key: v.string(),
    createdBy: v.id("users"),
    isArchived: v.boolean(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_key", ["key"]),

  // ============ CANVAS DATA ============
  canvasData: defineTable({
    projectId: v.id("projects"),
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("task"),
          v.literal("note"),
          v.literal("milestone")
        ),
        position: v.object({ x: v.number(), y: v.number() }),
        size: v.object({ width: v.number(), height: v.number() }),
        content: v.string(),
        color: v.string(),
        assignee: v.optional(v.string()),
      })
    ),
    containers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        position: v.object({ x: v.number(), y: v.number() }),
        size: v.object({ width: v.number(), height: v.number() }),
      })
    ),
    viewport: v.object({
      x: v.number(),
      y: v.number(),
      zoom: v.number(),
    }),
    version: v.number(),
    lastEditedBy: v.optional(v.id("users")),
  }).index("by_project", ["projectId"]),

  // ============ SHARED TEAM CANVAS ============
  sharedCanvas: defineTable({
    roomId: v.string(), // Unique room identifier (e.g., "default" for main shared room)
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("task"),
          v.literal("note"),
          v.literal("milestone")
        ),
        position: v.object({ x: v.number(), y: v.number() }),
        size: v.object({ width: v.number(), height: v.number() }),
        content: v.string(),
        color: v.string(),
        assignee: v.optional(v.string()),
      })
    ),
    containers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        position: v.object({ x: v.number(), y: v.number() }),
        size: v.object({ width: v.number(), height: v.number() }),
      })
    ),
    viewport: v.object({
      x: v.number(),
      y: v.number(),
      zoom: v.number(),
    }),
    version: v.number(),
    lastEditedBy: v.optional(v.string()), // User name/email
  }).index("by_room", ["roomId"]),
});
