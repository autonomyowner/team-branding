"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamWorkflow } from "@/context/TeamWorkflowContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./team-workflows.module.css";

export default function TeamWorkflowsPage() {
  const { user } = useAuth();
  const { projects, loadProjects, createProject, joinProject, deleteProject } = useTeamWorkflow();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
    setNewProjectName("");
    setNewProjectDescription("");
    setShowCreateModal(false);
  };

  const handleJoinProject = () => {
    if (!joinCode.trim()) return;
    setJoinError("");
    const project = joinProject(joinCode.trim().toUpperCase());
    if (project) {
      setJoinCode("");
      setShowJoinModal(false);
    } else {
      setJoinError("Project not found. Check the code and try again.");
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject(id);
    }
  };

  const userProjects = projects.filter(
    (p) => !p.isArchived && p.members.some((m) => m.userId === user?.id)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Team Workflows</h1>
          <p className={styles.subtitle}>
            Collaborate on workflows with your team in real-time
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.joinBtn}
            onClick={() => setShowJoinModal(true)}
          >
            Join Project
          </button>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </button>
        </div>
      </div>

      {userProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2>No projects yet</h2>
          <p>Create a new project or join an existing one to start collaborating</p>
          <div className={styles.emptyActions}>
            <button onClick={() => setShowJoinModal(true)} className={styles.joinBtn}>
              Join with Code
            </button>
            <button onClick={() => setShowCreateModal(true)} className={styles.createBtn}>
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {userProjects.map((project, index) => {
            const isOwner = project.members.find((m) => m.userId === user?.id)?.role === "owner";
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/dashboard/team-workflows/${project.id}`} className={styles.projectCard}>
                  <div className={styles.projectHeader}>
                    <h3>{project.name}</h3>
                    <span className={styles.projectCode}>{project.code}</span>
                  </div>
                  {project.description && (
                    <p className={styles.projectDescription}>{project.description}</p>
                  )}
                  <div className={styles.projectMeta}>
                    <div className={styles.memberAvatars}>
                      {project.members.slice(0, 4).map((member, i) => (
                        <div
                          key={member.userId}
                          className={styles.memberAvatar}
                          style={{ zIndex: 4 - i }}
                          title={member.userName}
                        >
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {project.members.length > 4 && (
                        <div className={styles.memberCount}>
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    <div className={styles.projectStats}>
                      <span>{project.workflows.length} workflows</span>
                      <span>{project.pages.length} pages</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      title="Delete project"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Create New Project</h2>
              <div className={styles.formGroup}>
                <label>Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description (optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="What is this project about?"
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
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Project Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className={styles.modalOverlay} onClick={() => setShowJoinModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Join Project</h2>
              <p className={styles.modalDescription}>
                Enter the 6-character project code to join an existing project.
              </p>
              <div className={styles.formGroup}>
                <label>Project Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                    setJoinError("");
                  }}
                  placeholder="ABCDEF"
                  className={styles.codeInput}
                  autoFocus
                  maxLength={6}
                />
                {joinError && <span className={styles.error}>{joinError}</span>}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleJoinProject}
                  disabled={joinCode.length !== 6}
                >
                  Join Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
