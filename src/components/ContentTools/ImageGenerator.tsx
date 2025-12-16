"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import PromptInput from "./PromptInput";
import styles from "./ContentTools.module.css";

export default function ImageGenerator() {
  const { user } = useAuth();
  const [userPrompt, setUserPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const enhancePromptAction = useAction(api.contentTools.actions.enhancePrompt);
  const generateImageAction = useAction(api.contentTools.actions.generateImage);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;

    setError("");
    setEnhancedPrompt("");
    setImageUrl("");

    try {
      // Step 1: Enhance prompt with Haiku
      setIsEnhancing(true);
      const { generationId, enhancedPrompt: enhanced } = await enhancePromptAction({
        userPrompt,
        type: "image",
        userId: user?.name || "guest",
      });

      setEnhancedPrompt(enhanced);
      setIsEnhancing(false);

      // Step 2: Generate image with enhanced prompt
      setIsGenerating(true);
      const { imageUrl: url } = await generateImageAction({
        generationId,
        enhancedPrompt: enhanced,
      });

      setImageUrl(url);
      setIsGenerating(false);
    } catch (err: any) {
      console.error("Generation failed:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        data: err.data
      });
      setError(err.message || err.toString() || "فشل إنشاء الصورة. يرجى المحاولة مرة أخرى.");
      setIsEnhancing(false);
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError("فشل تحميل الصورة. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <div className={styles.generatorContainer}>
      {/* Prompt Input */}
      <PromptInput
        value={userPrompt}
        onChange={setUserPrompt}
        onGenerate={handleGenerate}
        isLoading={isEnhancing || isGenerating}
        placeholder="اكتب وصفاً للصورة التي تريد إنشاءها..."
      />

      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Enhanced Prompt Display */}
      {enhancedPrompt && (
        <div className={styles.enhancedPrompt}>
          <h3>النص المحسّن</h3>
          <p>{enhancedPrompt}</p>
        </div>
      )}

      {/* Loading States */}
      {isEnhancing && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>جاري تحسين النص باستخدام الذكاء الاصطناعي...</p>
        </div>
      )}

      {isGenerating && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>جاري إنشاء الصورة...</p>
        </div>
      )}

      {/* Result Display */}
      {imageUrl && !isGenerating && (
        <div className={styles.resultContainer}>
          <img src={imageUrl} alt="Generated" className={styles.generatedImage} />
          <button onClick={handleDownload} className={styles.downloadBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            تحميل الصورة
          </button>
        </div>
      )}
    </div>
  );
}
