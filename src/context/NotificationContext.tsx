"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Notification,
  NotificationType,
  EntityType,
  ActivityItem,
  StatusUpdate,
  StatusUpdateType,
} from "@/types/collaboration";
import {
  notificationService,
  activityService,
  statusUpdateService,
} from "@/services/dataService";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => void;
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    entityType: EntityType,
    entityId: string,
    actionUrl?: string
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Activity Feed
  activityFeed: ActivityItem[];
  loadActivityFeed: () => void;

  // Status Updates
  statusUpdates: StatusUpdate[];
  loadStatusUpdates: () => void;
  createStatusUpdate: (
    title: string,
    content: string,
    type: StatusUpdateType,
    projectId?: string,
    boardId?: string
  ) => StatusUpdate;
  addReaction: (updateId: string, emoji: string) => void;
  togglePin: (updateId: string) => void;
  deleteStatusUpdate: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load data on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      loadNotifications();
      loadActivityFeed();
      loadStatusUpdates();
    }
  }, [user]);

  // ============ NOTIFICATIONS ============
  const loadNotifications = useCallback(() => {
    if (!user) return;
    setNotifications(notificationService.getAll(user.id));
  }, [user]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    entityType: EntityType,
    entityId: string,
    actionUrl?: string
  ) => {
    if (!user) return;
    const notification = notificationService.create({
      userId: user.id,
      type,
      title,
      message,
      entityType,
      entityId,
      read: false,
      actionUrl,
    });
    setNotifications(prev => [notification, ...prev]);
  }, [user]);

  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!user) return;
    notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  const deleteNotification = useCallback((id: string) => {
    notificationService.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ============ ACTIVITY FEED ============
  const loadActivityFeed = useCallback(() => {
    setActivityFeed(activityService.getAll(50));
  }, []);

  // ============ STATUS UPDATES ============
  const loadStatusUpdates = useCallback(() => {
    setStatusUpdates(statusUpdateService.getAll(20));
  }, []);

  const createStatusUpdate = useCallback((
    title: string,
    content: string,
    type: StatusUpdateType,
    projectId?: string,
    boardId?: string
  ): StatusUpdate => {
    if (!user) throw new Error("User not authenticated");
    const update = statusUpdateService.create({
      title,
      content,
      type,
      projectId,
      boardId,
      authorId: user.id,
      authorName: user.name,
      pinned: false,
    });
    setStatusUpdates(prev => [update, ...prev]);

    // Also add to activity feed
    activityService.create({
      userId: user.id,
      userName: user.name,
      action: 'posted a status update',
      entityType: 'project',
      entityId: projectId || boardId || '',
      entityName: title,
    });
    loadActivityFeed();

    return update;
  }, [user]);

  const addReaction = useCallback((updateId: string, emoji: string) => {
    if (!user) return;
    statusUpdateService.addReaction(updateId, user.id, emoji);
    setStatusUpdates(statusUpdateService.getAll(20));
  }, [user]);

  const togglePin = useCallback((updateId: string) => {
    statusUpdateService.togglePin(updateId);
    setStatusUpdates(statusUpdateService.getAll(20));
  }, []);

  const deleteStatusUpdate = useCallback((id: string) => {
    statusUpdateService.delete(id);
    setStatusUpdates(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        // Notifications
        notifications,
        unreadCount,
        loadNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,

        // Activity Feed
        activityFeed,
        loadActivityFeed,

        // Status Updates
        statusUpdates,
        loadStatusUpdates,
        createStatusUpdate,
        addReaction,
        togglePin,
        deleteStatusUpdate,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
