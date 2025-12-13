"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./workflows.module.css";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "error" | "draft";
  executions: number;
  successRate: number;
  lastRun: string;
  createdAt: string;
  trigger: string;
}

// Mock data
const initialWorkflows: Workflow[] = [
  {
    id: "1",
    name: "Customer Onboarding",
    description: "Automates new customer setup across CRM, billing, and communication platforms",
    status: "active",
    executions: 8472,
    successRate: 99.8,
    lastRun: "2 min ago",
    createdAt: "2024-01-15",
    trigger: "Webhook",
  },
  {
    id: "2",
    name: "Invoice Processing",
    description: "Extracts data from invoices and syncs to accounting system",
    status: "active",
    executions: 5234,
    successRate: 98.5,
    lastRun: "5 min ago",
    createdAt: "2024-02-20",
    trigger: "Schedule",
  },
  {
    id: "3",
    name: "Lead Scoring",
    description: "AI-powered lead qualification based on engagement metrics",
    status: "paused",
    executions: 3120,
    successRate: 97.2,
    lastRun: "1 hour ago",
    createdAt: "2024-03-01",
    trigger: "Event",
  },
  {
    id: "4",
    name: "Data Sync - Salesforce",
    description: "Bi-directional sync between Salesforce and internal database",
    status: "active",
    executions: 12050,
    successRate: 99.9,
    lastRun: "Just now",
    createdAt: "2024-01-01",
    trigger: "Schedule",
  },
  {
    id: "5",
    name: "Email Campaign Trigger",
    description: "Triggers personalized email sequences based on user behavior",
    status: "error",
    executions: 892,
    successRate: 85.3,
    lastRun: "3 hours ago",
    createdAt: "2024-03-15",
    trigger: "Event",
  },
  {
    id: "6",
    name: "Report Generator",
    description: "Weekly automated report generation and distribution",
    status: "draft",
    executions: 0,
    successRate: 0,
    lastRun: "Never",
    createdAt: "2024-03-20",
    trigger: "Schedule",
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "Webhook",
  });

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || workflow.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((w) => w.status === "active").length;
    const paused = workflows.filter((w) => w.status === "paused").length;
    const errors = workflows.filter((w) => w.status === "error").length;
    return { total, active, paused, errors };
  }, [workflows]);

  // Handlers
  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setFormData({ name: "", description: "", trigger: "Webhook" });
    setShowModal(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
    });
    setShowModal(true);
  };

  const handleSaveWorkflow = () => {
    if (!formData.name) return;

    if (editingWorkflow) {
      // Update existing
      setWorkflows(
        workflows.map((w) =>
          w.id === editingWorkflow.id
            ? { ...w, ...formData }
            : w
        )
      );
    } else {
      // Create new
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        status: "draft",
        executions: 0,
        successRate: 0,
        lastRun: "Never",
        createdAt: new Date().toISOString().split("T")[0],
        trigger: formData.trigger,
      };
      setWorkflows([newWorkflow, ...workflows]);
    }
    setShowModal(false);
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  const handleToggleStatus = (workflow: Workflow) => {
    const newStatus = workflow.status === "active" ? "paused" : "active";
    setWorkflows(
      workflows.map((w) =>
        w.id === workflow.id ? { ...w, status: newStatus } : w
      )
    );
  };

  return (
    <div className={styles.workflows}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Workflows</h1>
          <p>Manage and monitor your automated workflows</p>
        </div>
        <button className={styles.primaryBtn} onClick={handleCreateWorkflow}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.active}`}>{stats.active}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.paused}`}>{stats.paused}</span>
          <span className={styles.statLabel}>Paused</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.error}`}>{stats.errors}</span>
          <span className={styles.statLabel}>Errors</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchInput}>
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
        <div className={styles.statusFilters}>
          {["all", "active", "paused", "error", "draft"].map((status) => (
            <button
              key={status}
              className={statusFilter === status ? styles.active : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Status</th>
              <th>Trigger</th>
              <th>Executions</th>
              <th>Success Rate</th>
              <th>Last Run</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredWorkflows.map((workflow) => (
                <motion.tr
                  key={workflow.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td>
                    <div className={styles.workflowCell}>
                      <h4>{workflow.name}</h4>
                      <p>{workflow.description}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[workflow.status]}`}>
                      {workflow.status}
                    </span>
                  </td>
                  <td>
                    <span className={styles.triggerBadge}>{workflow.trigger}</span>
                  </td>
                  <td>{workflow.executions.toLocaleString()}</td>
                  <td>
                    <span
                      className={`${styles.successRate} ${
                        workflow.successRate >= 95
                          ? styles.high
                          : workflow.successRate >= 80
                          ? styles.medium
                          : styles.low
                      }`}
                    >
                      {workflow.successRate}%
                    </span>
                  </td>
                  <td className={styles.muted}>{workflow.lastRun}</td>
                  <td>
                    <div className={styles.actions}>
                      {workflow.status !== "draft" && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleToggleStatus(workflow)}
                          title={workflow.status === "active" ? "Pause" : "Activate"}
                        >
                          {workflow.status === "active" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleEditWorkflow(workflow)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredWorkflows.length === 0 && (
          <div className={styles.emptyState}>
            <p>No workflows found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{editingWorkflow ? "Edit Workflow" : "Create Workflow"}</h2>
                <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Workflow Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Customer Onboarding"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this workflow does..."
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Trigger Type</label>
                  <select
                    value={formData.trigger}
                    onChange={(e) =>
                      setFormData({ ...formData, trigger: e.target.value })
                    }
                  >
                    <option value="Webhook">Webhook</option>
                    <option value="Schedule">Schedule</option>
                    <option value="Event">Event</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleSaveWorkflow}
                  disabled={!formData.name}
                >
                  {editingWorkflow ? "Save Changes" : "Create Workflow"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
