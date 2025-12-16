export interface ContentGeneration {
  _id: string;
  workspaceId?: string;
  userId?: string;
  type: "image" | "video";
  userPrompt: string;
  enhancedPrompt?: string;
  model?: string;
  status: "enhancing" | "generating" | "completed" | "failed";
  resultUrl?: string;
  resultData?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface PromptEnhancementRequest {
  userPrompt: string;
  type: "image" | "video";
  userId?: string;
}

export interface PromptEnhancementResponse {
  generationId: string;
  enhancedPrompt: string;
}

export interface ImageGenerationRequest {
  generationId: string;
  enhancedPrompt: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
}

export interface VideoGenerationRequest {
  prompt: string;
}

export interface VideoGenerationResponse {
  html: string;
}
