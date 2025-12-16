"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import PromptInput from "./PromptInput";
import styles from "./ContentTools.module.css";

export default function VideoGenerator() {
  const { user } = useAuth();
  const [userPrompt, setUserPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const enhancePromptAction = useAction(api.contentTools.actions.enhancePrompt);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;

    setError("");
    setEnhancedPrompt("");
    setHtmlContent("");

    try {
      // Step 1: Enhance prompt with Haiku
      setIsEnhancing(true);
      const { enhancedPrompt: enhanced } = await enhancePromptAction({
        userPrompt,
        type: "video",
        userId: user?.name || "guest",
      });

      setEnhancedPrompt(enhanced);
      setIsEnhancing(false);

      // Step 2: Generate video HTML using the API route
      setIsGenerating(true);
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhanced,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل إنشاء الفيديو");
      }

      const { html } = await response.json();
      setHtmlContent(html);
      setIsGenerating(false);
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "فشل إنشاء الفيديو. يرجى المحاولة مرة أخرى.");
      setIsEnhancing(false);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tiktok-explainer-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    if (!htmlContent) return;

    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
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
        placeholder="اكتب فكرة الفيديو التعليمي..."
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
          <h3>المفهوم المحسّن</h3>
          <div className={styles.enhancedContent}>
            <pre>{enhancedPrompt}</pre>
          </div>
        </div>
      )}

      {/* Loading States */}
      {isEnhancing && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>جاري تحسين مفهوم الفيديو...</p>
        </div>
      )}

      {isGenerating && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>جاري إنشاء الفيديو المتحرك...</p>
        </div>
      )}

      {/* Result Display */}
      {htmlContent && !isGenerating && (
        <div className={styles.resultContainer}>
          <div className={styles.videoPreviewInfo}>
            <h3>الفيديو جاهز!</h3>
            <p>يمكنك معاينة الفيديو أو تحميله لتسجيله</p>
          </div>

          <div className={styles.actionButtons}>
            <button onClick={handlePreview} className={styles.previewBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              معاينة
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

          <div className={styles.instructions}>
            <h4>كيفية التسجيل:</h4>
            <ol>
              <li>افتح ملف HTML في متصفح</li>
              <li>استخدم أداة تسجيل الشاشة (OBS، QuickTime، إلخ)</li>
              <li>سجل الرسوم المتحركة</li>
              <li>احفظ كفيديو MP4</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
