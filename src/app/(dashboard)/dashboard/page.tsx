"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import TeamWorkflowDashboard from "@/components/TeamWorkflowDashboard";
import styles from "./dashboard-home.module.css";

type ViewMode = "workflow" | "canvas";

export default function DashboardPage() {
  const { user, isGuest } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("workflow");

  return (
    <div className={styles.dashboardHome}>
      {/* View Switcher */}
      <div className={styles.viewSwitcher}>
        <button
          className={`${styles.viewBtn} ${viewMode === "workflow" ? styles.active : ""}`}
          onClick={() => setViewMode("workflow")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <path d="M9 12h6M9 16h6" />
          </svg>
          سير عمل الفريق
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === "canvas" ? styles.active : ""}`}
          onClick={() => setViewMode("canvas")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          لوحة العمل
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "workflow" ? (
          <motion.div
            key="workflow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={styles.viewContent}
          >
            <TeamWorkflowDashboard />
          </motion.div>
        ) : (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={styles.viewContent}
          >
            <CanvasView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Canvas View Component (existing canvas functionality)
function CanvasView() {
  return (
    <div className={styles.canvasPlaceholder}>
      <div className={styles.canvasMessage}>
        <h2>لوحة العمل</h2>
        <p>لوحة تعاونية للتخطيط البصري والعصف الذهني</p>
        <div className={styles.canvasFeatures}>
          <div className={styles.feature}>
            <span className={styles.featureDot} style={{ backgroundColor: "#00fff2" }} />
            <span>المهام</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureDot} style={{ backgroundColor: "#ffa502" }} />
            <span>الملاحظات</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureDot} style={{ backgroundColor: "#7bed9f" }} />
            <span>الإنجازات</span>
          </div>
        </div>
        <p className={styles.hint}>استخدم اللوحة الجانبية لإضافة العناصر والحاويات</p>
      </div>
    </div>
  );
}
