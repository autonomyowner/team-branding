"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCollaboration } from "@/context/CollaborationContext";
import styles from "./roadmaps.module.css";

export default function RoadmapsPage() {
  const { roadmaps, loadRoadmaps, createRoadmap, deleteRoadmap } = useCollaboration();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoadmapName, setNewRoadmapName] = useState("");
  const [newRoadmapDescription, setNewRoadmapDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  const filteredRoadmaps = roadmaps.filter(
    (roadmap) =>
      !roadmap.isArchived &&
      (roadmap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roadmap.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateRoadmap = () => {
    if (!newRoadmapName.trim()) return;
    createRoadmap(newRoadmapName.trim(), newRoadmapDescription.trim());
    setNewRoadmapName("");
    setNewRoadmapDescription("");
    setShowCreateModal(false);
  };

  const handleDeleteRoadmap = (e: React.MouseEvent, roadmapId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this roadmap?")) {
      deleteRoadmap(roadmapId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Roadmaps</h1>
          <p className={styles.subtitle}>
            Plan and visualize your project timelines
          </p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Roadmap
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search roadmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredRoadmaps.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M3 12h12M3 18h6" strokeLinecap="round" />
              <circle cx="21" cy="12" r="2" />
              <circle cx="15" cy="18" r="2" />
            </svg>
          </div>
          <h3>No roadmaps yet</h3>
          <p>Create your first roadmap to visualize project timelines</p>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            Create Roadmap
          </button>
        </div>
      ) : (
        <div className={styles.roadmapsGrid}>
          {filteredRoadmaps.map((roadmap, index) => (
            <motion.div
              key={roadmap.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/roadmaps/${roadmap.id}`} className={styles.roadmapCard}>
                <div className={styles.roadmapHeader}>
                  <h3>{roadmap.name}</h3>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteRoadmap(e, roadmap.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
                {roadmap.description && (
                  <p className={styles.roadmapDescription}>{roadmap.description}</p>
                )}
                <div className={styles.roadmapMeta}>
                  <span className={styles.itemCount}>
                    {roadmap.items.length} items
                  </span>
                  <span className={styles.milestoneCount}>
                    {roadmap.milestones.length} milestones
                  </span>
                </div>
                <div className={styles.roadmapDate}>
                  Updated {formatDate(roadmap.updatedAt)}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Roadmap Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create New Roadmap</h2>
            <div className={styles.formGroup}>
              <label>Roadmap Name</label>
              <input
                type="text"
                value={newRoadmapName}
                onChange={(e) => setNewRoadmapName(e.target.value)}
                placeholder="e.g., Q1 2025 Product Roadmap"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description (optional)</label>
              <textarea
                value={newRoadmapDescription}
                onChange={(e) => setNewRoadmapDescription(e.target.value)}
                placeholder="What are the goals for this roadmap?"
                rows={3}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleCreateRoadmap}
                disabled={!newRoadmapName.trim()}
              >
                Create Roadmap
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
