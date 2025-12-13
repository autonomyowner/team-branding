"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamWorkflow } from "@/context/TeamWorkflowContext";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import styles from "./project.module.css";

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { user } = useAuth();
  const {
    projects,
    loadProjects,
    setCurrentProject,
    workflows,
    loadWorkflows,
    createWorkflow,
    deleteWorkflow,
    pages,
    loadPages,
    createPage,
    deletePage,
    activities,
    loadActivities,
    phantomPresences,
    startPresenceSimulation,
    stopPresenceSimulation,
  } = useTeamWorkflow();

  const [showCreateWorkflowModal, setShowCreateWorkflowModal] = useState(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"workflows" | "pages">("workflows");

  const project = projects.find((p) => p.id === projectId);
  const currentMember = project?.members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === "owner";
  const canEdit = currentMember?.role !== "viewer";

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      loadWorkflows(projectId);
      loadPages(projectId);
      loadActivities(projectId);
      startPresenceSimulation(projectId);
    }

    return () => {
      stopPresenceSimulation();
    };
  }, [project, projectId, setCurrentProject, loadWorkflows, loadPages, loadActivities, startPresenceSimulation, stopPresenceSimulation]);

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    const workflow = createWorkflow(projectId, newWorkflowName.trim());
    setNewWorkflowName("");
    setShowCreateWorkflowModal(false);
    router.push(`/dashboard/team-workflows/${projectId}/workflow/${workflow.id}`);
  };

  const handleCreatePage = () => {
    if (!newPageTitle.trim()) return;
    const page = createPage(projectId, newPageTitle.trim());
    setNewPageTitle("");
    setShowCreatePageModal(false);
    router.push(`/dashboard/team-workflows/${projectId}/page/${page.id}`);
  };

  const handleDeleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this workflow?")) {
      deleteWorkflow(id);
    }
  };

  const handleDeletePage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this page?")) {
      deletePage(id);
    }
  };

  const copyProjectCode = () => {
    if (project) {
      navigator.clipboard.writeText(project.code);
    }
  };

  if (!project) {
    return (
      <div className={styles.loading}>
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard/team-workflows" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1>{project.name}</h1>
            <div className={styles.projectMeta}>
              <button className={styles.codeBtn} onClick={copyProjectCode} title="Click to copy">
                {project.code}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <span className={styles.memberCount}>{project.members.length} members</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.presenceIndicators}>
            {phantomPresences.slice(0, 3).map((presence) => (
              <div
                key={presence.id}
                className={styles.presenceAvatar}
                style={{ backgroundColor: presence.color }}
                title={`${presence.userName} is online`}
              >
                {presence.userName.charAt(0)}
                <span className={styles.presenceDot} />
              </div>
            ))}
            {phantomPresences.length > 3 && (
              <div className={styles.morePresence}>+{phantomPresences.length - 3}</div>
            )}
          </div>
          {canEdit && (
            <button className={styles.inviteBtn} onClick={() => setShowInviteModal(true)}>
              Share
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTabs}>
            <button
              className={`${styles.tab} ${activeTab === "workflows" ? styles.active : ""}`}
              onClick={() => setActiveTab("workflows")}
            >
              Workflows
            </button>
            <button
              className={`${styles.tab} ${activeTab === "pages" ? styles.active : ""}`}
              onClick={() => setActiveTab("pages")}
            >
              Pages
            </button>
          </div>

          {activeTab === "workflows" ? (
            <div className={styles.sidebarContent}>
              {canEdit && (
                <button
                  className={styles.createItemBtn}
                  onClick={() => setShowCreateWorkflowModal(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New Workflow
                </button>
              )}
              <div className={styles.itemList}>
                {workflows.length === 0 ? (
                  <p className={styles.emptyList}>No workflows yet</p>
                ) : (
                  workflows.map((workflow) => (
                    <Link
                      key={workflow.id}
                      href={`/dashboard/team-workflows/${projectId}/workflow/${workflow.id}`}
                      className={styles.listItem}
                    >
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{workflow.name}</span>
                        <span className={styles.itemMeta}>
                          {workflow.nodes.length} nodes
                        </span>
                      </div>
                      <span className={`${styles.statusBadge} ${styles[workflow.status]}`}>
                        {workflow.status}
                      </span>
                      {canEdit && (
                        <button
                          className={styles.itemDeleteBtn}
                          onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={styles.sidebarContent}>
              {canEdit && (
                <button
                  className={styles.createItemBtn}
                  onClick={() => setShowCreatePageModal(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New Page
                </button>
              )}
              <div className={styles.itemList}>
                {pages.length === 0 ? (
                  <p className={styles.emptyList}>No pages yet</p>
                ) : (
                  pages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/dashboard/team-workflows/${projectId}/page/${page.id}`}
                      className={styles.listItem}
                    >
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{page.title}</span>
                        <span className={styles.itemMeta}>
                          {page.blocks.length} blocks
                        </span>
                      </div>
                      {canEdit && (
                        <button
                          className={styles.itemDeleteBtn}
                          onClick={(e) => handleDeletePage(page.id, e)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className={styles.activitySection}>
          <h2>Activity</h2>
          <div className={styles.activityFeed}>
            {activities.length === 0 ? (
              <p className={styles.emptyActivity}>No activity yet. Start by creating a workflow or page.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityAvatar}>
                    {activity.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.activityContent}>
                    <p>
                      <strong>{activity.userName}</strong> {activity.action}{" "}
                      <span className={styles.entityName}>{activity.entityName}</span>
                    </p>
                    <span className={styles.activityTime}>
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className={styles.membersSection}>
        <h2>Team Members</h2>
        <div className={styles.membersList}>
          {project.members.map((member) => (
            <div key={member.userId} className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                {member.userName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.userName}</span>
                <span className={styles.memberEmail}>{member.email}</span>
              </div>
              <span className={`${styles.roleBadge} ${styles[member.role]}`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workflow Modal */}
      <AnimatePresence>
        {showCreateWorkflowModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreateWorkflowModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>New Workflow</h2>
              <div className={styles.formGroup}>
                <label>Workflow Name</label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateWorkflow()}
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowCreateWorkflowModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflowName.trim()}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Page Modal */}
      <AnimatePresence>
        {showCreatePageModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreatePageModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>New Page</h2>
              <div className={styles.formGroup}>
                <label>Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Enter page title"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePage()}
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowCreatePageModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleCreatePage}
                  disabled={!newPageTitle.trim()}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Share Project</h2>
              <p className={styles.modalDescription}>
                Share this code with your team members so they can join the project.
              </p>
              <div className={styles.shareCode}>
                <span>{project.code}</span>
                <button onClick={copyProjectCode}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.submitBtn} onClick={() => setShowInviteModal(false)}>
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
