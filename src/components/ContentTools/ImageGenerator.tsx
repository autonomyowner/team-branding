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
  const [htmlContent, setHtmlContent] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const enhancePromptAction = useAction(api.contentTools.actions.enhancePrompt);
  const generateImageAction = useAction(api.contentTools.actions.generateImage);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;

    setError("");
    setEnhancedPrompt("");
    setHtmlContent("");

    try {
      // Step 1: Enhance prompt with Haiku
      console.log("Step 1: Starting prompt enhancement...");
      setIsEnhancing(true);

      const enhanceResult = await enhancePromptAction({
        userPrompt,
        type: "image",
        userId: user?.name || "guest",
      });

      console.log("Step 1 completed:", enhanceResult);

      if (!enhanceResult || !enhanceResult.enhancedPrompt) {
        throw new Error("Failed to enhance prompt: No enhanced prompt returned");
      }

      setEnhancedPrompt(enhanceResult.enhancedPrompt);
      setIsEnhancing(false);

      // Step 2: Generate HTML visual content
      console.log("Step 2: Starting HTML generation...");
      setIsGenerating(true);

      const generateResult = await generateImageAction({
        generationId: enhanceResult.generationId,
        enhancedPrompt: enhanceResult.enhancedPrompt,
      });

      console.log("Step 2 completed:", generateResult);

      if (!generateResult || !generateResult.htmlContent) {
        throw new Error("Failed to generate HTML: No content returned");
      }

      setHtmlContent(generateResult.htmlContent);
      setIsGenerating(false);
    } catch (err: any) {
      console.error("Generation failed:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        data: err.data
      });
      setError(err.message || err.toString() || "فشل إنشاء المحتوى. يرجى المحاولة مرة أخرى.");
      setIsEnhancing(false);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!htmlContent) return;

    try {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `visual-content-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError("فشل تحميل الملف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleOpenInNewTab = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
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
      {htmlContent && !isGenerating && (
        <div className={styles.resultContainer}>
          <div className={styles.previewSection}>
            <iframe
              srcDoc={htmlContent}
              className={styles.htmlPreview}
              title="Generated Visual Content"
              sandbox="allow-scripts"
            />
          </div>
          <div className={styles.actionButtons}>
            <button onClick={handleOpenInNewTab} className={styles.actionBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              فتح في نافذة جديدة
            </button>
            <button onClick={handleDownload} className={styles.downloadBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              تحميل HTML
            </button>
          </div>
          <p className={styles.instructionText}>
            💡 نصيحة: افتح في نافذة جديدة، ثم استخدم أداة لقطة الشاشة (Screenshot) لحفظ كصورة أو سجل الشاشة (Screen Record) لحفظ كفيديو
          </p>
        </div>
      )}
    </div>
  );
}
