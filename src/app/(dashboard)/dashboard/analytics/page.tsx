"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./analytics.module.css";

// Mock data for charts
const weeklyData = [
  { day: "Mon", executions: 2100, success: 2080, errors: 20 },
  { day: "Tue", executions: 2400, success: 2350, errors: 50 },
  { day: "Wed", executions: 1800, success: 1750, errors: 50 },
  { day: "Thu", executions: 2800, success: 2760, errors: 40 },
  { day: "Fri", executions: 3200, success: 3150, errors: 50 },
  { day: "Sat", executions: 1600, success: 1580, errors: 20 },
  { day: "Sun", executions: 2100, success: 2070, errors: 30 },
];

const workflowPerformance = [
  { name: "Customer Onboarding", executions: 8472, avgTime: "1.2s", successRate: 99.8 },
  { name: "Invoice Processing", executions: 5234, avgTime: "2.4s", successRate: 98.5 },
  { name: "Data Sync - Salesforce", executions: 12050, avgTime: "0.8s", successRate: 99.9 },
  { name: "Lead Scoring", executions: 3120, avgTime: "3.1s", successRate: 97.2 },
  { name: "Email Campaign Trigger", executions: 892, avgTime: "1.8s", successRate: 85.3 },
];

const executionsByHour = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  count: Math.floor(Math.random() * 500) + 100,
}));

const errorTypes = [
  { type: "Timeout", count: 45, percentage: 35 },
  { type: "API Error", count: 32, percentage: 25 },
  { type: "Rate Limit", count: 26, percentage: 20 },
  { type: "Auth Failed", count: 15, percentage: 12 },
  { type: "Other", count: 10, percentage: 8 },
];

const maxExecutions = Math.max(...weeklyData.map((d) => d.executions));
const maxHourly = Math.max(...executionsByHour.map((d) => d.count));

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className={styles.analytics}>
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Analytics</h1>
          <p>Monitor performance and identify optimization opportunities</p>
        </div>
        <div className={styles.timeRangeSelector}>
          {["24h", "7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              className={timeRange === range ? styles.active : ""}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.summaryIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Executions</span>
            <span className={styles.summaryValue}>16,000</span>
            <span className={styles.summaryChange}>+18% from last period</span>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className={`${styles.summaryIcon} ${styles.success}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Success Rate</span>
            <span className={styles.summaryValue}>98.4%</span>
            <span className={styles.summaryChange}>+0.3% from last period</span>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`${styles.summaryIcon} ${styles.warning}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Avg Response Time</span>
            <span className={styles.summaryValue}>1.8s</span>
            <span className={`${styles.summaryChange} ${styles.negative}`}>+0.2s from last period</span>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className={`${styles.summaryIcon} ${styles.error}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Failed Executions</span>
            <span className={styles.summaryValue}>260</span>
            <span className={`${styles.summaryChange} ${styles.negative}`}>+12 from last period</span>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className={styles.chartsRow}>
        {/* Executions Chart */}
        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.chartHeader}>
            <h2>Executions Over Time</h2>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} />
                Success
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.error}`} />
                Errors
              </span>
            </div>
          </div>
          <div className={styles.barChart}>
            {weeklyData.map((data, i) => (
              <div key={i} className={styles.barGroup}>
                <div className={styles.barStack}>
                  <motion.div
                    className={styles.bar}
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.success / maxExecutions) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.05 }}
                  />
                  <motion.div
                    className={`${styles.bar} ${styles.errorBar}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.errors / maxExecutions) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.05 }}
                  />
                </div>
                <span className={styles.barLabel}>{data.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hourly Distribution */}
        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className={styles.chartHeader}>
            <h2>Executions by Hour</h2>
          </div>
          <div className={styles.heatmapGrid}>
            {executionsByHour.map((data, i) => (
              <div
                key={i}
                className={styles.heatmapCell}
                style={{
                  opacity: 0.3 + (data.count / maxHourly) * 0.7,
                }}
                title={`${data.hour}:00 - ${data.count} executions`}
              >
                <span>{data.hour}</span>
              </div>
            ))}
          </div>
          <p className={styles.heatmapNote}>Peak activity: 14:00 - 16:00</p>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        {/* Workflow Performance */}
        <motion.div
          className={styles.tableCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.chartHeader}>
            <h2>Workflow Performance</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Executions</th>
                <th>Avg Time</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {workflowPerformance.map((workflow, i) => (
                <tr key={i}>
                  <td>{workflow.name}</td>
                  <td>{workflow.executions.toLocaleString()}</td>
                  <td>{workflow.avgTime}</td>
                  <td>
                    <span
                      className={`${styles.successRate} ${
                        workflow.successRate >= 95
                          ? styles.high
                          : workflow.successRate >= 80
                          ? styles.medium
                          : styles.low
                      }`}
                    >
                      {workflow.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Error Breakdown */}
        <motion.div
          className={styles.errorCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className={styles.chartHeader}>
            <h2>Error Breakdown</h2>
          </div>
          <div className={styles.errorList}>
            {errorTypes.map((error, i) => (
              <div key={i} className={styles.errorItem}>
                <div className={styles.errorInfo}>
                  <span className={styles.errorType}>{error.type}</span>
                  <span className={styles.errorCount}>{error.count}</span>
                </div>
                <div className={styles.errorBar}>
                  <motion.div
                    className={styles.errorProgress}
                    initial={{ width: 0 }}
                    animate={{ width: `${error.percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
