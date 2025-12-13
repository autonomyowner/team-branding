"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, parseISO, differenceInDays } from "date-fns";
import { useCollaboration } from "@/context/CollaborationContext";
import styles from "./sprints.module.css";

export default function SprintsPage() {
  const {
    projects,
    loadProjects,
    createProject,
    deleteProject,
    createSprint,
    startSprint,
    completeSprint,
  } = useCollaboration();

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Project form
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Sprint form
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const activeProjects = projects.filter((p) => !p.isArchived);

  const handleCreateProject = () => {
    if (!projectName.trim() || !projectKey.trim()) return;
    createProject(projectName.trim(), projectKey.trim(), projectDescription.trim());
    setProjectName("");
    setProjectKey("");
    setProjectDescription("");
    setShowProjectModal(false);
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(projectId);
    }
  };

  const openSprintModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSprintName("");
    setSprintGoal("");
    setSprintStartDate(format(new Date(), "yyyy-MM-dd"));
    setSprintEndDate(format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
    setShowSprintModal(true);
  };

  const handleCreateSprint = () => {
    if (!sprintName.trim() || !sprintStartDate || !sprintEndDate || !selectedProjectId) return;

    createSprint(selectedProjectId, {
      name: sprintName.trim(),
      goal: sprintGoal.trim(),
      startDate: sprintStartDate,
      endDate: sprintEndDate,
      status: "planning",
      committedPoints: 0,
      completedPoints: 0,
    });

    setShowSprintModal(false);
    loadProjects();
  };

  const handleStartSprint = (projectId: string, sprintId: string) => {
    startSprint(projectId, sprintId);
    loadProjects();
  };

  const handleCompleteSprint = (projectId: string, sprintId: string) => {
    if (confirm("Complete this sprint?")) {
      completeSprint(projectId, sprintId);
      loadProjects();
    }
  };

  const getSprintProgress = (sprint: any) => {
    if (sprint.committedPoints === 0) return 0;
    return Math.round((sprint.completedPoints / sprint.committedPoints) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    if (days < 0) return "Overdue";
    if (days === 0) return "Ends today";
    return `${days} days left`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Sprints</h1>
          <p className={styles.subtitle}>
            Plan and track your agile sprints
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/sprints/backlog" className={styles.backlogBtn}>
            View Backlog
          </Link>
          <button
            className={styles.createBtn}
            onClick={() => setShowProjectModal(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      {activeProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
          </div>
          <h3>No projects yet</h3>
          <p>Create a project to start planning sprints</p>
          <button
            className={styles.createBtn}
            onClick={() => setShowProjectModal(true)}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className={styles.projectsList}>
          {activeProjects.map((project, index) => {
            const activeSprint = project.sprints.find((s) => s.status === "active");
            const planningSprints = project.sprints.filter((s) => s.status === "planning");
            const completedSprints = project.sprints.filter((s) => s.status === "completed");

            return (
              <motion.div
                key={project.id}
                className={styles.projectCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={styles.projectHeader}>
                  <div className={styles.projectInfo}>
                    <span className={styles.projectKey}>{project.key}</span>
                    <h2>{project.name}</h2>
                    {project.description && (
                      <p className={styles.projectDescription}>{project.description}</p>
                    )}
                  </div>
                  <button
                    className={styles.deleteProjectBtn}
                    onClick={(e) => handleDeleteProject(e, project.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>

                {/* Active Sprint */}
                {activeSprint && (
                  <div className={styles.activeSprint}>
                    <div className={styles.sprintHeader}>
                      <span className={styles.sprintStatus}>Active Sprint</span>
                      <span className={styles.sprintDays}>{getDaysRemaining(activeSprint.endDate)}</span>
                    </div>
                    <h3>{activeSprint.name}</h3>
                    {activeSprint.goal && (
                      <p className={styles.sprintGoal}>{activeSprint.goal}</p>
                    )}
                    <div className={styles.sprintProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${getSprintProgress(activeSprint)}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {activeSprint.completedPoints}/{activeSprint.committedPoints} pts
                      </span>
                    </div>
                    <div className={styles.sprintActions}>
                      <button
                        className={styles.completeBtn}
                        onClick={() => handleCompleteSprint(project.id, activeSprint.id)}
                      >
                        Complete Sprint
                      </button>
                    </div>
                  </div>
                )}

                {/* No Active Sprint */}
                {!activeSprint && planningSprints.length > 0 && (
                  <div className={styles.noActiveSprint}>
                    <p>No active sprint. Start one of the planned sprints.</p>
                  </div>
                )}

                {/* Planned Sprints */}
                {planningSprints.length > 0 && (
                  <div className={styles.sprintsList}>
                    <h4>Planned Sprints</h4>
                    {planningSprints.map((sprint) => (
                      <div key={sprint.id} className={styles.sprintItem}>
                        <div className={styles.sprintItemInfo}>
                          <span className={styles.sprintName}>{sprint.name}</span>
                          <span className={styles.sprintDates}>
                            {format(parseISO(sprint.startDate), "MMM d")} - {format(parseISO(sprint.endDate), "MMM d")}
                          </span>
                        </div>
                        <button
                          className={styles.startBtn}
                          onClick={() => handleStartSprint(project.id, sprint.id)}
                          disabled={!!activeSprint}
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className={styles.projectStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{project.sprints.length}</span>
                    <span className={styles.statLabel}>Sprints</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{completedSprints.length}</span>
                    <span className={styles.statLabel}>Completed</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>
                      {project.averageVelocity ? Math.round(project.averageVelocity) : "-"}
                    </span>
                    <span className={styles.statLabel}>Avg Velocity</span>
                  </div>
                </div>

                <button
                  className={styles.addSprintBtn}
                  onClick={() => openSprintModal(project.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Plan Sprint
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProjectModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create New Project</h2>
            <div className={styles.formGroup}>
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Mobile App"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Project Key</label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g., MOB"
                maxLength={5}
              />
              <span className={styles.hint}>Short identifier for tickets</span>
            </div>
            <div className={styles.formGroup}>
              <label>Description (optional)</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={2}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowProjectModal(false)}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleCreateProject}
                disabled={!projectName.trim() || !projectKey.trim()}
              >
                Create Project
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sprint Modal */}
      {showSprintModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSprintModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Plan New Sprint</h2>
            <div className={styles.formGroup}>
              <label>Sprint Name</label>
              <input
                type="text"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder="e.g., Sprint 1"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Sprint Goal (optional)</label>
              <textarea
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="What do you want to achieve?"
                rows={2}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={sprintStartDate}
                  onChange={(e) => setSprintStartDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  value={sprintEndDate}
                  onChange={(e) => setSprintEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSprintModal(false)}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleCreateSprint}
                disabled={!sprintName.trim() || !sprintStartDate || !sprintEndDate}
              >
                Create Sprint
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
