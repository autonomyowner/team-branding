import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Step 1: Enhance prompt using Haiku via OpenRouter
export const enhancePrompt = mutation({
  args: {
    userPrompt: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { userPrompt, type, userId }) => {
    // Create generation record
    const generationId = await ctx.db.insert("contentGenerations", {
      userPrompt,
      type,
      userId,
      status: "enhancing",
      createdAt: Date.now(),
    });

    // Call OpenRouter Haiku API for prompt enhancement
    const enhancementTemplate = type === "image"
      ? `You are a prompt engineering expert for image generation. Enhance this prompt using chain-of-thought reasoning:

User prompt: "${userPrompt}"

Think through:
1. What visual elements are implied?
2. What style would work best for TikTok/social media?
3. What details would make this more vivid and engaging?
4. What composition would maximize visual impact?

Then output an enhanced prompt (max 200 words) that is specific, detailed, and optimized for image generation. Apply best practices for viral social media content.`
      : `You are a TikTok/Reels content expert. Enhance this video idea using chain-of-thought reasoning:

User prompt: "${userPrompt}"

Think through:
1. What's the hook (first 3 seconds) that will grab attention?
2. What's the main message or value proposition?
3. How should this be structured for vertical video format?
4. What visual elements and transitions will keep viewers engaged?
5. How can we apply viral content patterns (pattern interrupts, curiosity gaps, etc.)?

Then output an enhanced video concept with clear sections:
- HOOK: (what grabs attention in first 3 seconds)
- MESSAGE: (core value/information)
- VISUAL PLAN: (key scenes, transitions, text overlays)
- ENGAGEMENT: (call-to-action, retention tactics)`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://p1-workspace.app",
          "X-Title": "P1 Content Tools",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            { role: "user", content: enhancementTemplate }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const enhancedPrompt = data.choices[0].message.content;

      // Update generation record
      await ctx.db.patch(generationId, {
        enhancedPrompt,
        status: "generating",
      });

      return { generationId, enhancedPrompt };
    } catch (error: any) {
      await ctx.db.patch(generationId, {
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  },
});

// Step 2: Generate image using OpenRouter
export const generateImage = mutation({
  args: {
    generationId: v.id("contentGenerations"),
    enhancedPrompt: v.string(),
  },
  handler: async (ctx, { generationId, enhancedPrompt }) => {
    try {
      // Use OpenRouter's image generation endpoint (DALL-E 3)
      const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://p1-workspace.app",
          "X-Title": "P1 Content Tools",
        },
        body: JSON.stringify({
          model: "openai/dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Image generation error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      await ctx.db.patch(generationId, {
        resultUrl: imageUrl,
        status: "completed",
        completedAt: Date.now(),
        model: "dall-e-3",
      });

      return { imageUrl };
    } catch (error: any) {
      await ctx.db.patch(generationId, {
        status: "failed",
        error: error.message,
      });
      throw error;
    }
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
