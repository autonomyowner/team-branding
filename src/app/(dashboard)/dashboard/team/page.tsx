"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./team.module.css";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "active" | "pending";
  joinedAt: string;
}

const initialMembers: TeamMember[] = [
  { id: "1", name: "John Smith", email: "john@company.com", role: "Admin", status: "active", joinedAt: "Jan 15, 2024" },
  { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Editor", status: "active", joinedAt: "Feb 20, 2024" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "Editor", status: "active", joinedAt: "Mar 1, 2024" },
  { id: "4", name: "Emily Davis", email: "emily@company.com", role: "Viewer", status: "pending", joinedAt: "Mar 18, 2024" },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Editor" | "Viewer">("Viewer");

  const handleInvite = () => {
    if (!inviteEmail) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
      joinedAt: "Just now",
    };

    setMembers([...members, newMember]);
    setInviteEmail("");
    setShowInviteModal(false);
  };

  const handleRemove = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleRoleChange = (id: string, role: "Admin" | "Editor" | "Viewer") => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  return (
    <div className={styles.team}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Team</h1>
          <p>Manage your team members and their permissions</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowInviteModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" />
          </svg>
          Invite Member
        </button>
      </motion.div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{members.length}</span>
          <span className={styles.statLabel}>Total Members</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{members.filter((m) => m.status === "active").length}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{members.filter((m) => m.status === "pending").length}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td>
                  <div className={styles.memberCell}>
                    <div className={styles.avatar}>{member.name.charAt(0)}</div>
                    <div>
                      <span className={styles.name}>{member.name}</span>
                      <span className={styles.email}>{member.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as "Admin" | "Editor" | "Viewer")
                    }
                    className={styles.roleSelect}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[member.status]}`}>
                    {member.status}
                  </span>
                </td>
                <td className={styles.muted}>{member.joinedAt}</td>
                <td>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(member.id)}
                  >
                    Remove
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Invite Team Member</h2>
                <button className={styles.closeBtn} onClick={() => setShowInviteModal(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "Admin" | "Editor" | "Viewer")}
                  >
                    <option value="Viewer">Viewer - Can view workflows</option>
                    <option value="Editor">Editor - Can edit workflows</option>
                    <option value="Admin">Admin - Full access</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.secondaryBtn} onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button className={styles.primaryBtn} onClick={handleInvite} disabled={!inviteEmail}>
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
