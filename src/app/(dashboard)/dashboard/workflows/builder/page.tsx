"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCollaboration } from "@/context/CollaborationContext";
import styles from "./builder.module.css";

export default function WorkflowBuilderPage() {
  const { workflows, loadWorkflows, createWorkflow, deleteWorkflow } = useCollaboration();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.status !== "archived" &&
      (workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    const workflow = createWorkflow(newWorkflowName.trim(), newWorkflowDescription.trim());
    setNewWorkflowName("");
    setNewWorkflowDescription("");
    setShowCreateModal(false);
  };

  const handleDeleteWorkflow = (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workflow?")) {
      deleteWorkflow(workflowId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return styles.statusActive;
      case "draft":
        return styles.statusDraft;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Workflow Builder</h1>
          <p className={styles.subtitle}>
            Create and manage visual workflow diagrams
          </p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Workflow
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
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredWorkflows.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h3>No workflows yet</h3>
          <p>Create your first workflow to visualize processes</p>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            Create Workflow
          </button>
        </div>
      ) : (
        <div className={styles.workflowsGrid}>
          {filteredWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/workflows/builder/${workflow.id}`} className={styles.workflowCard}>
                <div className={styles.workflowHeader}>
                  <div>
                    <span className={`${styles.status} ${getStatusStyle(workflow.status)}`}>
                      {workflow.status}
                    </span>
                    <h3>{workflow.name}</h3>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteWorkflow(e, workflow.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
                {workflow.description && (
                  <p className={styles.workflowDescription}>{workflow.description}</p>
                )}
                <div className={styles.workflowMeta}>
                  <span>{workflow.nodes.length} nodes</span>
                  <span>{workflow.edges.length} connections</span>
                </div>
                <div className={styles.workflowDate}>
                  Updated {formatDate(workflow.updatedAt)}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create New Workflow</h2>
            <div className={styles.formGroup}>
              <label>Workflow Name</label>
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g., User Onboarding Flow"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description (optional)</label>
              <textarea
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="What does this workflow do?"
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
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
              >
                Create Workflow
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
