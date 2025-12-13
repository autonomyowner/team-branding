"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCollaboration } from "@/context/CollaborationContext";
import { BacklogItem, BacklogItemType, Priority } from "@/types/collaboration";
import styles from "./backlog.module.css";

export default function BacklogPage() {
  const {
    projects,
    backlogItems,
    loadProjects,
    loadBacklogItems,
    createBacklogItem,
    updateBacklogItem,
    deleteBacklogItem,
    moveItemToSprint,
  } = useCollaboration();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [filterType, setFilterType] = useState<BacklogItemType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  // Form state
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemType, setItemType] = useState<BacklogItemType>("story");
  const [itemPriority, setItemPriority] = useState<Priority>("medium");
  const [itemPoints, setItemPoints] = useState("");

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadBacklogItems(selectedProjectId);
    }
  }, [selectedProjectId, loadBacklogItems]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filteredItems = backlogItems.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterPriority !== "all" && item.priority !== filterPriority) return false;
    return item.status !== "in_sprint";
  });

  const openItemModal = (item?: BacklogItem) => {
    if (item) {
      setEditingItem(item);
      setItemTitle(item.title);
      setItemDescription(item.description);
      setItemType(item.type);
      setItemPriority(item.priority);
      setItemPoints(item.storyPoints?.toString() || "");
    } else {
      setEditingItem(null);
      setItemTitle("");
      setItemDescription("");
      setItemType("story");
      setItemPriority("medium");
      setItemPoints("");
    }
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemTitle.trim() || !selectedProjectId) return;

    if (editingItem) {
      updateBacklogItem(editingItem.id, {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        type: itemType,
        priority: itemPriority,
        storyPoints: itemPoints ? parseInt(itemPoints) : undefined,
      });
    } else {
      createBacklogItem({
        projectId: selectedProjectId,
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        type: itemType,
        priority: itemPriority,
        storyPoints: itemPoints ? parseInt(itemPoints) : undefined,
        status: "backlog",
        labels: [],
      });
    }

    setShowItemModal(false);
    loadBacklogItems(selectedProjectId);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Delete this item?")) {
      deleteBacklogItem(itemId);
      loadBacklogItems(selectedProjectId);
    }
  };

  const handleMoveToSprint = (itemId: string, sprintId: string) => {
    moveItemToSprint(itemId, sprintId);
    loadBacklogItems(selectedProjectId);
  };

  const priorityColors: Record<Priority, string> = {
    critical: "var(--priority-critical)",
    high: "var(--priority-high)",
    medium: "var(--priority-medium)",
    low: "var(--priority-low)",
  };

  const typeLabels: Record<BacklogItemType, string> = {
    story: "Story",
    bug: "Bug",
    task: "Task",
    epic: "Epic",
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/sprints" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Sprints
          </Link>
          <span className={styles.separator}>/</span>
          <h1>Backlog</h1>
        </div>
        <button className={styles.addBtn} onClick={() => openItemModal()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Project Selector & Filters */}
      <div className={styles.toolbar}>
        <div className={styles.projectSelector}>
          <label>Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects
              .filter((p) => !p.isArchived)
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} - {project.name}
                </option>
              ))}
          </select>
        </div>

        <div className={styles.filters}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as BacklogItemType | "all")}
          >
            <option value="all">All Types</option>
            <option value="story">Stories</option>
            <option value="bug">Bugs</option>
            <option value="task">Tasks</option>
            <option value="epic">Epics</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Backlog Items */}
      {projects.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No projects yet</h3>
          <p>Create a project first to add backlog items</p>
          <Link href="/dashboard/sprints" className={styles.linkBtn}>
            Go to Sprints
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Backlog is empty</h3>
          <p>Add items to your backlog to plan sprints</p>
          <button className={styles.addBtn} onClick={() => openItemModal()}>
            Add First Item
          </button>
        </div>
      ) : (
        <div className={styles.backlogList}>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={styles.backlogItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <div className={styles.itemLeft}>
                <span
                  className={styles.priorityDot}
                  style={{ backgroundColor: priorityColors[item.priority] }}
                  title={item.priority}
                />
                <span className={styles.itemType}>{typeLabels[item.type]}</span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.description && (
                    <span className={styles.itemDescription}>{item.description}</span>
                  )}
                </div>
              </div>

              <div className={styles.itemRight}>
                {item.storyPoints && (
                  <span className={styles.points}>{item.storyPoints} pts</span>
                )}

                {selectedProject && selectedProject.sprints.filter((s) => s.status === "planning").length > 0 && (
                  <select
                    className={styles.sprintSelect}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleMoveToSprint(item.id, e.target.value);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Move to Sprint</option>
                    {selectedProject.sprints
                      .filter((s) => s.status === "planning" || s.status === "active")
                      .map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </option>
                      ))}
                  </select>
                )}

                <button
                  className={styles.editBtn}
                  onClick={() => openItemModal(item)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className={styles.summary}>
          <span>{filteredItems.length} items</span>
          <span>
            {filteredItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0)} total points
          </span>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className={styles.modalOverlay} onClick={() => setShowItemModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingItem ? "Edit Item" : "New Backlog Item"}</h2>

            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="Item title"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as BacklogItemType)}
                >
                  <option value="story">Story</option>
                  <option value="bug">Bug</option>
                  <option value="task">Task</option>
                  <option value="epic">Epic</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priority</label>
                <select
                  value={itemPriority}
                  onChange={(e) => setItemPriority(e.target.value as Priority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Story Points</label>
                <input
                  type="number"
                  value={itemPoints}
                  onChange={(e) => setItemPoints(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowItemModal(false)}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleSaveItem}
                disabled={!itemTitle.trim()}
              >
                {editingItem ? "Save" : "Add Item"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
