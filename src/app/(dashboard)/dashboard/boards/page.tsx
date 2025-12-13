"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCollaboration } from "@/context/CollaborationContext";
import { KanbanBoard } from "@/types/collaboration";
import styles from "./boards.module.css";

export default function BoardsPage() {
  const { boards, loadBoards, createBoard, deleteBoard } = useCollaboration();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const filteredBoards = boards.filter(
    (board) =>
      !board.isArchived &&
      (board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    createBoard(newBoardName.trim(), newBoardDescription.trim());
    setNewBoardName("");
    setNewBoardDescription("");
    setShowCreateModal(false);
  };

  const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this board?")) {
      deleteBoard(boardId);
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
          <h1>Boards</h1>
          <p className={styles.subtitle}>
            Manage your team's tasks with Kanban boards
          </p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Board
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
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredBoards.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="12" rx="1" />
              <rect x="17" y="3" width="5" height="8" rx="1" />
            </svg>
          </div>
          <h3>No boards yet</h3>
          <p>Create your first Kanban board to start organizing tasks</p>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            Create Board
          </button>
        </div>
      ) : (
        <div className={styles.boardsGrid}>
          {filteredBoards.map((board, index) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/boards/${board.id}`} className={styles.boardCard}>
                <div className={styles.boardHeader}>
                  <h3>{board.name}</h3>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
                {board.description && (
                  <p className={styles.boardDescription}>{board.description}</p>
                )}
                <div className={styles.boardMeta}>
                  <span className={styles.columnCount}>
                    {board.columns.length} columns
                  </span>
                  <span className={styles.boardDate}>
                    Updated {formatDate(board.updatedAt)}
                  </span>
                </div>
                <div className={styles.boardLabels}>
                  {board.labels.slice(0, 4).map((label) => (
                    <span
                      key={label.id}
                      className={styles.labelDot}
                      style={{ backgroundColor: label.color }}
                      title={label.name}
                    />
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create New Board</h2>
            <div className={styles.formGroup}>
              <label>Board Name</label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="e.g., Product Roadmap"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description (optional)</label>
              <textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="What is this board for?"
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
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim()}
              >
                Create Board
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
