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
          model: "anthropic/claude-3-haiku-20240307",
          messages: [
            { role: "user", content: enhancementTemplate }
          ],
          max_tokens: 1024,
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

// Step 2: Generate visual HTML content using OpenRouter
export const generateImage = action({
  args: {
    generationId: v.id("contentGenerations"),
    enhancedPrompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ htmlContent: string }> => {
    const { internal } = await import("../_generated/api");
    const { generationId, enhancedPrompt } = args;

    try {
      // Check if API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set");
      }

      console.log("Generating HTML visual content with OpenRouter...");

      const htmlPrompt = `You are an expert at creating stunning visual HTML pages optimized for social media content.

Based on this enhanced prompt:
"${enhancedPrompt}"

Create a complete, standalone HTML page that visualizes this concept. The page should be:
- Visually stunning with modern CSS (gradients, animations, shadows, etc.)
- Optimized for 1080x1080px (Instagram) or 1080x1920px (TikTok/Reels) dimensions
- Include smooth CSS animations that loop
- Use beautiful typography and color schemes
- No external dependencies (inline all CSS and JS)
- Ready to screenshot or screen record

Output ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. No explanations, just pure HTML.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://p1-workspace.app",
          "X-Title": "P1 Content Tools",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet-20241022",
          messages: [
            { role: "user", content: htmlPrompt }
          ],
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTML generation error (${response.status}): ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `HTML generation error: ${errorData.error?.message || errorText}`;
        } catch {
          errorMessage = `HTML generation error: ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response structure from OpenRouter API");
      }

      let htmlContent = data.choices[0].message.content;

      // Extract HTML if wrapped in code blocks
      const htmlMatch = htmlContent.match(/```html\n([\s\S]*?)\n```/) || htmlContent.match(/```\n([\s\S]*?)\n```/);
      if (htmlMatch) {
        htmlContent = htmlMatch[1];
      }

      // Clean up any leading/trailing whitespace
      htmlContent = htmlContent.trim();

      console.log("HTML content generated successfully");

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        resultData: htmlContent,
        status: "completed",
        completedAt: Date.now(),
        model: "claude-3.5-sonnet",
      });

      return { htmlContent };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred during HTML generation";
      console.error("generateImage error:", errorMessage);
      console.error("Error stack:", error.stack);

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        status: "failed",
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
});

// Step 2b: Generate animated video HTML content using OpenRouter
export const generateVideo = action({
  args: {
    generationId: v.id("contentGenerations"),
    enhancedPrompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ htmlContent: string }> => {
    const { internal } = await import("../_generated/api");
    const { generationId, enhancedPrompt } = args;

    try {
      // Check if API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set");
      }

      console.log("Generating animated video HTML content with OpenRouter...");

      const htmlPrompt = `You are an expert at creating stunning animated HTML pages optimized for TikTok/Reels screen recording.

Based on this video concept:
"${enhancedPrompt}"

Create a complete, standalone HTML page with animated scenes that can be screen recorded. Requirements:
- Vertical format optimized for TikTok (360x640px container centered on page)
- Multiple animated slides/scenes that transition automatically
- Smooth CSS animations (fade, slide, scale, bounce effects)
- Bold, eye-catching typography in Arabic (use 'Cairo' or 'Tajawal' font families)
- Vibrant gradient backgrounds that change per slide
- Animation timing: each slide visible for 3-4 seconds, total loop ~15-20 seconds
- Text animations (fade in, slide up, typewriter effects)
- Modern design with shadows, rounded corners, glassmorphism effects
- No external dependencies (inline all CSS and JS)
- Include a subtle progress indicator
- RTL text direction for Arabic content

The animation should:
1. Start with a hook/attention grabber (first slide)
2. Present the main message/content (middle slides)
3. End with a call-to-action or memorable closing

Output ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. No explanations, just pure HTML.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://p1-workspace.app",
          "X-Title": "P1 Content Tools",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet-20241022",
          messages: [
            { role: "user", content: htmlPrompt }
          ],
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Video HTML generation error (${response.status}): ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `Video HTML generation error: ${errorData.error?.message || errorText}`;
        } catch {
          errorMessage = `Video HTML generation error: ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response structure from OpenRouter API");
      }

      let htmlContent = data.choices[0].message.content;

      // Extract HTML if wrapped in code blocks
      const htmlMatch = htmlContent.match(/```html\n([\s\S]*?)\n```/) || htmlContent.match(/```\n([\s\S]*?)\n```/);
      if (htmlMatch) {
        htmlContent = htmlMatch[1];
      }

      // Clean up any leading/trailing whitespace
      htmlContent = htmlContent.trim();

      console.log("Video HTML content generated successfully");

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        resultData: htmlContent,
        status: "completed",
        completedAt: Date.now(),
        model: "claude-3.5-sonnet",
      });

      return { htmlContent };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred during video HTML generation";
      console.error("generateVideo error:", errorMessage);
      console.error("Error stack:", error.stack);

      await ctx.runMutation(internal.contentTools.mutations.updateGeneration, {
        generationId,
        status: "failed",
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
});