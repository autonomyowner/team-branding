import { action } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// Step 1: Enhance prompt using Haiku via OpenRouter
export const enhancePrompt = action({
  args: {
    userPrompt: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ generationId: Id<"contentGenerations">; enhancedPrompt: string }> => {
    console.log("enhancePrompt called with args:", args);
    const { internal } = await import("../_generated/api");
    const { userPrompt, type, userId } = args;

    console.log("Creating generation record...");
    // Create generation record via internal mutation
    const generationId = await ctx.runMutation(internal.contentTools.mutations.createGeneration, {
      userPrompt,
      type,
      userId,
    });
    console.log("Generation record created:", generationId);

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
      console.log("Checking API key...");
      // Check if API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set");
      }

      console.log("Calling OpenRouter API...");
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
        const errorText = await response.text();
        let errorMessage = `OpenRouter API error (${response.status}): ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `OpenRouter API error: ${errorData.error?.message || errorText}`;
        } catch {
          errorMessage = `OpenRouter API error: ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response structure from OpenRouter API");
      }

      const enhancedPrompt = data.choices[0].message.content;
      console.log("Enhanced prompt received, updating record...");

      // Update generation record via internal mutation
      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        enhancedPrompt,
        status: "generating",
      });

      console.log("Successfully completed enhancePrompt");
      return { generationId, enhancedPrompt };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred during prompt enhancement";
      console.error("enhancePrompt error:", errorMessage);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        status: "failed",
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
});

// Step 2: Generate image using OpenRouter
export const generateImage = action({
  args: {
    generationId: v.id("contentGenerations"),
    enhancedPrompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ imageUrl: string }> => {
    const { internal } = await import("../_generated/api");
    const { generationId, enhancedPrompt } = args;

    try {
      // Check if API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }

      // Use OpenAI's API directly for image generation (DALL-E 3)
      // Note: OpenRouter doesn't support image generation, only text models
      console.log("Calling OpenAI DALL-E 3 API...");
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Image generation error (${response.status}): ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `Image generation error: ${errorData.error?.message || errorText}`;
        } catch {
          errorMessage = `Image generation error: ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error("Invalid response structure from image generation API");
      }

      const imageUrl = data.data[0].url;

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        resultUrl: imageUrl,
        status: "completed",
        completedAt: Date.now(),
        model: "dall-e-3",
      });

      return { imageUrl };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred during image generation";
      console.error("generateImage error:", errorMessage, error);

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        status: "failed",
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
});
