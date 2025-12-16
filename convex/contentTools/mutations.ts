import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Helper: Create generation record
export const createGeneration = internalMutation({
  args: {
    userPrompt: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { userPrompt, type, userId }) => {
    const generationId = await ctx.db.insert("contentGenerations", {
      userPrompt,
      type,
      userId,
      status: "enhancing",
      createdAt: Date.now(),
    });
    return generationId;
  },
});

// Helper: Update generation record
export const updateGeneration = internalMutation({
  args: {
    generationId: v.id("contentGenerations"),
    enhancedPrompt: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("enhancing"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    )),
    resultUrl: v.optional(v.string()),
    resultData: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    model: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { generationId, ...updates }) => {
    await ctx.db.patch(generationId, updates);
  },
});

// Get generation history
export const getHistory = mutation({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const query = ctx.db.query("contentGenerations");

    const generations = userId
      ? await query.filter(q => q.eq(q.field("userId"), userId))
          .order("desc")
          .take(limit)
      : await query.order("desc").take(limit);

    return generations;
  },
});
