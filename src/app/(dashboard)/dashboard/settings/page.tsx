"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: user?.company || "",
    role: user?.role || "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    workflowAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
  });

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
    { id: "billing", label: "Billing" },
    { id: "api", label: "API Keys" },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    updateUser(profileData);
    setSuccessMessage("Profile updated successfully");
    setIsSaving(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSuccessMessage("Notification preferences updated");
    setIsSaving(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className={styles.settings}>
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          className={styles.successMessage}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {successMessage}
        </motion.div>
      )}

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.section}
            >
              <div className={styles.sectionHeader}>
                <h2>Profile Information</h2>
                <p>Update your personal information</p>
              </div>

              <div className={styles.avatarSection}>
                <div className={styles.avatar}>
                  {profileData.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.avatarInfo}>
                  <button className={styles.secondaryBtn}>Change Avatar</button>
                  <p>JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Company</label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) =>
                      setProfileData({ ...profileData, company: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <input
                    type="text"
                    value={profileData.role}
                    onChange={(e) =>
                      setProfileData({ ...profileData, role: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.primaryBtn}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.section}
            >
              <div className={styles.sectionHeader}>
                <h2>Notification Preferences</h2>
                <p>Choose how you want to be notified</p>
              </div>

              <div className={styles.toggleList}>
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>Email Notifications</h4>
                    <p>Receive email updates about your account activity</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>Workflow Alerts</h4>
                    <p>Get notified when workflows fail or require attention</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.workflowAlerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          workflowAlerts: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>Weekly Reports</h4>
                    <p>Receive a weekly summary of your workflow performance</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          weeklyReports: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>Marketing Emails</h4>
                    <p>Receive product updates and promotional offers</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          marketingEmails: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.primaryBtn}
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.section}
            >
              <div className={styles.sectionHeader}>
                <h2>Security Settings</h2>
                <p>Manage your account security</p>
              </div>

              <div className={styles.securityCard}>
                <div className={styles.securityInfo}>
                  <h4>Password</h4>
                  <p>Last changed 30 days ago</p>
                </div>
                <button className={styles.secondaryBtn}>Change Password</button>
              </div>

              <div className={styles.securityCard}>
                <div className={styles.securityInfo}>
                  <h4>Two-Factor Authentication</h4>
                  <p>
                    {securitySettings.twoFactorEnabled
                      ? "Enabled - Your account is protected"
                      : "Add an extra layer of security to your account"}
                  </p>
                </div>
                <button
                  className={
                    securitySettings.twoFactorEnabled
                      ? styles.dangerBtn
                      : styles.primaryBtn
                  }
                  onClick={() =>
                    setSecuritySettings({
                      ...securitySettings,
                      twoFactorEnabled: !securitySettings.twoFactorEnabled,
                    })
                  }
                >
                  {securitySettings.twoFactorEnabled ? "Disable" : "Enable"}
                </button>
              </div>

              <div className={styles.securityCard}>
                <div className={styles.securityInfo}>
                  <h4>Session Timeout</h4>
                  <p>Automatically log out after inactivity</p>
                </div>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: e.target.value,
                    })
                  }
                  className={styles.select}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className={styles.dangerZone}>
                <h3>Danger Zone</h3>
                <div className={styles.dangerCard}>
                  <div className={styles.dangerInfo}>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                  <button className={styles.dangerBtn}>Delete Account</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.section}
            >
              <div className={styles.sectionHeader}>
                <h2>Billing & Subscription</h2>
                <p>Manage your subscription and payment methods</p>
              </div>

              <div className={styles.planCard}>
                <div className={styles.planHeader}>
                  <div>
                    <span className={styles.planLabel}>Current Plan</span>
                    <h3>Professional</h3>
                  </div>
                  <span className={styles.planPrice}>$1,499/mo</span>
                </div>
                <div className={styles.planFeatures}>
                  <p>Up to 100,000 workflow executions</p>
                  <p>25 team members</p>
                  <p>Priority support</p>
                </div>
                <div className={styles.planActions}>
                  <button className={styles.primaryBtn}>Upgrade Plan</button>
                  <button className={styles.secondaryBtn}>View Invoice History</button>
                </div>
              </div>

              <div className={styles.usageSection}>
                <h3>Current Usage</h3>
                <div className={styles.usageBar}>
                  <div className={styles.usageProgress} style={{ width: "68%" }} />
                </div>
                <p>68,000 / 100,000 executions used this billing period</p>
              </div>
            </motion.div>
          )}

          {/* API Keys Tab */}
          {activeTab === "api" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.section}
            >
              <div className={styles.sectionHeader}>
                <h2>API Keys</h2>
                <p>Manage API keys for programmatic access</p>
              </div>

              <div className={styles.apiKeyCard}>
                <div className={styles.apiKeyInfo}>
                  <h4>Production Key</h4>
                  <code>nx_prod_****************************</code>
                  <p>Created on Jan 15, 2024</p>
                </div>
                <div className={styles.apiKeyActions}>
                  <button className={styles.secondaryBtn}>Reveal</button>
                  <button className={styles.dangerBtn}>Revoke</button>
                </div>
              </div>

              <div className={styles.apiKeyCard}>
                <div className={styles.apiKeyInfo}>
                  <h4>Development Key</h4>
                  <code>nx_dev_****************************</code>
                  <p>Created on Mar 1, 2024</p>
                </div>
                <div className={styles.apiKeyActions}>
                  <button className={styles.secondaryBtn}>Reveal</button>
                  <button className={styles.dangerBtn}>Revoke</button>
                </div>
              </div>

              <button className={styles.primaryBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Generate New Key
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
