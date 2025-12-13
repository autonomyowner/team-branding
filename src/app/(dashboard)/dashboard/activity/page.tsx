"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { StatusUpdateType } from "@/types/collaboration";
import styles from "./activity.module.css";

export default function ActivityPage() {
  const { user } = useAuth();
  const {
    notifications,
    activityFeed,
    statusUpdates,
    loadNotifications,
    loadActivityFeed,
    loadStatusUpdates,
    markAsRead,
    markAllAsRead,
    createStatusUpdate,
    addReaction,
    togglePin,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"activity" | "notifications" | "updates">("activity");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateType, setUpdateType] = useState<StatusUpdateType>("progress");

  useEffect(() => {
    loadNotifications();
    loadActivityFeed();
    loadStatusUpdates();
  }, [loadNotifications, loadActivityFeed, loadStatusUpdates]);

  const handleCreateUpdate = () => {
    if (!updateTitle.trim() || !updateContent.trim()) return;
    createStatusUpdate(updateTitle.trim(), updateContent.trim(), updateType);
    setUpdateTitle("");
    setUpdateContent("");
    setShowUpdateModal(false);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const getTypeStyle = (type: StatusUpdateType) => {
    switch (type) {
      case "progress":
        return styles.typeProgress;
      case "blocker":
        return styles.typeBlocker;
      case "announcement":
        return styles.typeAnnouncement;
      case "milestone":
        return styles.typeMilestone;
      default:
        return "";
    }
  };

  const reactions = ["👍", "🎉", "❤️", "🚀", "👀"];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Activity</h1>
          <p className={styles.subtitle}>
            Track team updates and notifications
          </p>
        </div>
        <button className={styles.updateBtn} onClick={() => setShowUpdateModal(true)}>
          Post Update
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "activity" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          Activity Feed
        </button>
        <button
          className={`${styles.tab} ${activeTab === "notifications" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className={styles.badge}>
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "updates" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("updates")}
        >
          Status Updates
        </button>
      </div>

      {/* Activity Feed */}
      {activeTab === "activity" && (
        <div className={styles.feed}>
          {activityFeed.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No activity yet. Actions across the platform will appear here.</p>
            </div>
          ) : (
            activityFeed.map((activity, index) => (
              <motion.div
                key={activity.id}
                className={styles.activityItem}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className={styles.activityAvatar}>
                  {activity.userName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.activityContent}>
                  <p>
                    <strong>{activity.userName}</strong> {activity.action}{" "}
                    <span className={styles.entityName}>{activity.entityName}</span>
                  </p>
                  <span className={styles.activityTime}>{formatTime(activity.createdAt)}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className={styles.feed}>
          {notifications.length > 0 && (
            <div className={styles.notificationsHeader}>
              <button onClick={markAllAsRead} className={styles.markAllBtn}>
                Mark all as read
              </button>
            </div>
          )}
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.read ? styles.unread : ""}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={styles.notificationContent}>
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className={styles.notificationTime}>{formatTime(notification.createdAt)}</span>
                </div>
                {!notification.read && <span className={styles.unreadDot} />}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Status Updates */}
      {activeTab === "updates" && (
        <div className={styles.updates}>
          {statusUpdates.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No status updates yet. Share progress with your team.</p>
              <button className={styles.updateBtn} onClick={() => setShowUpdateModal(true)}>
                Post First Update
              </button>
            </div>
          ) : (
            statusUpdates.map((update, index) => (
              <motion.div
                key={update.id}
                className={`${styles.updateCard} ${update.pinned ? styles.pinned : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className={styles.updateHeader}>
                  <span className={`${styles.updateType} ${getTypeStyle(update.type)}`}>
                    {update.type}
                  </span>
                  {update.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
                  <button
                    className={styles.pinBtn}
                    onClick={() => togglePin(update.id)}
                    title={update.pinned ? "Unpin" : "Pin"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v10M12 18v4M4 12h16" />
                    </svg>
                  </button>
                </div>
                <h3>{update.title}</h3>
                <p className={styles.updateContent}>{update.content}</p>
                <div className={styles.updateMeta}>
                  <span className={styles.updateAuthor}>
                    <span className={styles.authorAvatar}>
                      {update.authorName.charAt(0).toUpperCase()}
                    </span>
                    {update.authorName}
                  </span>
                  <span className={styles.updateTime}>{formatTime(update.createdAt)}</span>
                </div>
                <div className={styles.reactions}>
                  {reactions.map((emoji) => {
                    const count = update.reactions.filter((r) => r.emoji === emoji).length;
                    const hasReacted = update.reactions.some(
                      (r) => r.userId === user?.id && r.emoji === emoji
                    );
                    return (
                      <button
                        key={emoji}
                        className={`${styles.reactionBtn} ${hasReacted ? styles.reacted : ""}`}
                        onClick={() => addReaction(update.id, emoji)}
                      >
                        {emoji} {count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Post Update Modal */}
      {showUpdateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUpdateModal(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Post Status Update</h2>

            <div className={styles.formGroup}>
              <label>Update Type</label>
              <div className={styles.typeSelector}>
                {(["progress", "blocker", "announcement", "milestone"] as StatusUpdateType[]).map(
                  (type) => (
                    <button
                      key={type}
                      className={`${styles.typeOption} ${updateType === type ? styles.selected : ""} ${getTypeStyle(type)}`}
                      onClick={() => setUpdateType(type)}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                placeholder="Update title"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>Content</label>
              <textarea
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="Share what's happening..."
                rows={4}
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleCreateUpdate}
                disabled={!updateTitle.trim() || !updateContent.trim()}
              >
                Post Update
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
