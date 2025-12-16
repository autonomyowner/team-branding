import { action } from "../_generated/server";
import { v } from "convex/values";

// Simple test action to verify client can call actions
export const testAction = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args): Promise<{ result: string }> => {
    return { result: `Echo: ${args.message}` };
  },
});
