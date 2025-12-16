"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageGenerator from "./ImageGenerator";
import VideoGenerator from "./VideoGenerator";
import styles from "./ContentTools.module.css";

type ToolMode = "image" | "video";

export default function ContentTools() {
  const [activeMode, setActiveMode] = useState<ToolMode>("image");

  return (
    <div className={styles.contentTools}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>أدوات المحتوى</h1>
          <p className={styles.subtitle}>
            إنشاء صور ومقاطع فيديو احترافية باستخدام الذكاء الاصطناعي
          </p>
        </div>
      </div>

      {/* Tool Switcher */}
      <div className={styles.toolSwitcher}>
        <button
          className={`${styles.toolBtn} ${activeMode === "image" ? styles.active : ""}`}
          onClick={() => setActiveMode("image")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          إنشاء صورة
        </button>

        <button
          className={`${styles.toolBtn} ${activeMode === "video" ? styles.active : ""}`}
          onClick={() => setActiveMode("video")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          إنشاء فيديو
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeMode === "image" ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ImageGenerator />
          </motion.div>
        ) : (
          <motion.div
            key="video"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <VideoGenerator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
