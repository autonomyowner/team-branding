"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./integrations.module.css";

const integrations = [
  { id: "1", name: "Salesforce", category: "CRM", status: "connected", description: "Sync contacts, leads, and opportunities" },
  { id: "2", name: "Slack", category: "Communication", status: "connected", description: "Send notifications and alerts" },
  { id: "3", name: "Google Sheets", category: "Productivity", status: "connected", description: "Read and write spreadsheet data" },
  { id: "4", name: "Stripe", category: "Payments", status: "available", description: "Process payments and subscriptions" },
  { id: "5", name: "HubSpot", category: "CRM", status: "available", description: "Marketing automation and CRM" },
  { id: "6", name: "Zendesk", category: "Support", status: "available", description: "Customer support ticketing" },
  { id: "7", name: "Jira", category: "Project Management", status: "available", description: "Issue and project tracking" },
  { id: "8", name: "AWS S3", category: "Storage", status: "connected", description: "Cloud file storage" },
];

export default function IntegrationsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIntegrations = integrations.filter((int) => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "connected" && int.status === "connected") ||
      (filter === "available" && int.status === "available");
    return matchesSearch && matchesFilter;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className={styles.integrations}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Integrations</h1>
          <p>Connect your favorite tools and services</p>
        </div>
        <div className={styles.stats}>
          <span className={styles.connected}>{connectedCount} connected</span>
          <span className={styles.available}>{integrations.length - connectedCount} available</span>
        </div>
      </motion.div>

      <div className={styles.filters}>
        <div className={styles.searchInput}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterButtons}>
          {["all", "connected", "available"].map((f) => (
            <button
              key={f}
              className={filter === f ? styles.active : ""}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        className={styles.grid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {filteredIntegrations.map((integration, i) => (
          <motion.div
            key={integration.id}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.integrationIcon}>
                {integration.name.charAt(0)}
              </div>
              <span className={`${styles.statusBadge} ${styles[integration.status]}`}>
                {integration.status}
              </span>
            </div>
            <h3>{integration.name}</h3>
            <span className={styles.category}>{integration.category}</span>
            <p>{integration.description}</p>
            <button
              className={
                integration.status === "connected"
                  ? styles.secondaryBtn
                  : styles.primaryBtn
              }
            >
              {integration.status === "connected" ? "Configure" : "Connect"}
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
