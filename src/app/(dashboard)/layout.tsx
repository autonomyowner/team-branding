"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { CollaborationProvider } from "@/context/CollaborationContext";
import { NotificationProvider, useNotifications } from "@/context/NotificationContext";
import { TeamWorkflowProvider } from "@/context/TeamWorkflowContext";
import styles from "./dashboard.module.css";

const navItems = [
  {
    name: "لوحة العمل",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
];

function NotificationButton() {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className={styles.notificationContainer}>
      <button
        className={styles.notificationBtn}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className={styles.notificationDropdown}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.notificationHeader}>
              <span>الإشعارات</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className={styles.markAllRead}>
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
            <div className={styles.notificationList}>
              {notifications.length === 0 ? (
                <div className={styles.emptyNotifications}>
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={styles.notificationContent}>
                      <span className={styles.notificationTitle}>{notification.title}</span>
                      <span className={styles.notificationMessage}>{notification.message}</span>
                    </div>
                    {!notification.read && <span className={styles.unreadDot} />}
                  </div>
                ))
              )}
            </div>
            {notifications.length > 5 && (
              <Link href="/dashboard" className={styles.viewAllLink}>
                عرض كل الإشعارات
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, isGuest, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>جاري التحميل...</p>
      </div>
    );
  }

  // Allow guest mode - no redirect needed
  if (!user) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logo}>
            <span className={styles.logoMark}>BT</span>
            {!sidebarCollapsed && <span className={styles.logoText}>BRANDING TEAM</span>}
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className={styles.navLabel}>{item.name}</span>
                )}
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter} />
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          {/* Expand Sidebar Button - shows when collapsed */}
          {sidebarCollapsed && (
            <button
              className={styles.expandSidebarBtn}
              onClick={() => setSidebarCollapsed(false)}
              aria-label="توسيع القائمة"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          )}
          <div className={styles.searchBar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder="البحث في المهام والعناصر..." />
            <span className={styles.searchShortcut}>Ctrl+K</span>
          </div>

          <div className={styles.topBarActions}>
            <NotificationButton />

            {/* Show Login/Signup for guests, User Menu for authenticated users */}
            {isGuest ? (
              <div className={styles.authButtons}>
                <Link href="/login" className={styles.loginBtn}>
                  تسجيل الدخول
                </Link>
                <Link href="/signup" className={styles.signupBtn}>
                  إنشاء حساب
                </Link>
              </div>
            ) : (
              <div className={styles.userMenu}>
                <button
                  className={styles.userMenuBtn}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className={styles.userAvatar}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userCompany}>{user.company}</span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className={styles.userDropdown}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className={styles.dropdownHeader}>
                        <span>{user.email}</span>
                      </div>
                      <button onClick={logout} className={styles.dropdownItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        تسجيل الخروج
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CollaborationProvider>
      <TeamWorkflowProvider>
        <NotificationProvider>
          <DashboardContent>{children}</DashboardContent>
        </NotificationProvider>
      </TeamWorkflowProvider>
    </CollaborationProvider>
  );
}
