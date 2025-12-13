"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachWeekOfInterval, parseISO } from "date-fns";
import { useCollaboration } from "@/context/CollaborationContext";
import { RoadmapItem, Milestone } from "@/types/collaboration";
import styles from "./roadmap.module.css";

export default function RoadmapViewPage() {
  const params = useParams();
  const roadmapId = params.id as string;

  const {
    roadmaps,
    loadRoadmaps,
    addRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    addMilestone,
  } = useCollaboration();

  const [showItemModal, setShowItemModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  // Item form state
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemStartDate, setItemStartDate] = useState("");
  const [itemEndDate, setItemEndDate] = useState("");
  const [itemStatus, setItemStatus] = useState<RoadmapItem["status"]>("planned");
  const [itemProgress, setItemProgress] = useState("0");

  // Milestone form state
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");

  const roadmap = roadmaps.find((r) => r.id === roadmapId);

  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  // Calculate date range for the Gantt chart
  const dateRange = useMemo(() => {
    if (!roadmap || roadmap.items.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 90)),
        weeks: eachWeekOfInterval({ start: today, end: addDays(today, 90) }),
      };
    }

    const dates = roadmap.items.flatMap((item) => [
      parseISO(item.startDate),
      parseISO(item.endDate),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = startOfWeek(addDays(minDate, -7));
    const end = endOfWeek(addDays(maxDate, 14));

    return {
      start,
      end,
      weeks: eachWeekOfInterval({ start, end }),
    };
  }, [roadmap]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start);
  const dayWidth = 40;

  const getBarStyle = (item: RoadmapItem) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);
    const left = differenceInDays(startDate, dateRange.start) * dayWidth;
    const width = (differenceInDays(endDate, startDate) + 1) * dayWidth;

    return { left: `${left}px`, width: `${width}px` };
  };

  const getMilestonePosition = (milestone: Milestone) => {
    const date = parseISO(milestone.targetDate);
    return differenceInDays(date, dateRange.start) * dayWidth;
  };

  const statusColors: Record<RoadmapItem["status"], string> = {
    planned: "var(--status-draft)",
    in_progress: "var(--status-active)",
    completed: "var(--status-completed)",
    blocked: "var(--status-blocked)",
  };

  const openItemModal = (item?: RoadmapItem) => {
    if (item) {
      setEditingItem(item);
      setItemTitle(item.title);
      setItemDescription(item.description || "");
      setItemStartDate(item.startDate);
      setItemEndDate(item.endDate);
      setItemStatus(item.status);
      setItemProgress(item.progress.toString());
    } else {
      setEditingItem(null);
      setItemTitle("");
      setItemDescription("");
      setItemStartDate(format(new Date(), "yyyy-MM-dd"));
      setItemEndDate(format(addDays(new Date(), 14), "yyyy-MM-dd"));
      setItemStatus("planned");
      setItemProgress("0");
    }
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemTitle.trim() || !itemStartDate || !itemEndDate) return;

    if (editingItem) {
      updateRoadmapItem(roadmapId, editingItem.id, {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        startDate: itemStartDate,
        endDate: itemEndDate,
        status: itemStatus,
        progress: parseInt(itemProgress),
      });
    } else {
      addRoadmapItem(roadmapId, {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        startDate: itemStartDate,
        endDate: itemEndDate,
        status: itemStatus,
        progress: parseInt(itemProgress),
        dependencies: [],
      });
    }

    setShowItemModal(false);
    loadRoadmaps();
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Delete this item?")) {
      deleteRoadmapItem(roadmapId, itemId);
      loadRoadmaps();
    }
  };

  const handleAddMilestone = () => {
    if (!milestoneName.trim() || !milestoneDate) return;

    addMilestone(roadmapId, {
      name: milestoneName.trim(),
      description: milestoneDescription.trim(),
      targetDate: milestoneDate,
      status: "planned",
    });

    setMilestoneName("");
    setMilestoneDate("");
    setMilestoneDescription("");
    setShowMilestoneModal(false);
    loadRoadmaps();
  };

  if (!roadmap) {
    return (
      <div className={styles.loading}>
        <p>Loading roadmap...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/roadmaps" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Roadmaps
          </Link>
          <span className={styles.separator}>/</span>
          <h1>{roadmap.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={() => setShowMilestoneModal(true)}>
            Add Milestone
          </button>
          <button className={styles.addBtnPrimary} onClick={() => openItemModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Item
          </button>
        </div>
      </div>

      <div className={styles.ganttContainer}>
        {/* Timeline Header */}
        <div className={styles.timelineHeader} style={{ width: `${totalDays * dayWidth}px` }}>
          {dateRange.weeks.map((week, index) => (
            <div
              key={index}
              className={styles.weekHeader}
              style={{ width: `${7 * dayWidth}px` }}
            >
              <span>{format(week, "MMM d")}</span>
            </div>
          ))}
        </div>

        {/* Milestones Row */}
        {roadmap.milestones.length > 0 && (
          <div className={styles.milestonesRow} style={{ width: `${totalDays * dayWidth}px` }}>
            {roadmap.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={styles.milestone}
                style={{ left: `${getMilestonePosition(milestone)}px` }}
                title={`${milestone.name}: ${format(parseISO(milestone.targetDate), "MMM d, yyyy")}`}
              >
                <div className={styles.milestoneDiamond} />
                <span className={styles.milestoneLabel}>{milestone.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Items */}
        <div className={styles.ganttBody}>
          {roadmap.items.length === 0 ? (
            <div className={styles.emptyItems}>
              <p>No items yet. Add items to see them on the timeline.</p>
            </div>
          ) : (
            roadmap.items.map((item, index) => (
              <div key={item.id} className={styles.ganttRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemDates}>
                    {format(parseISO(item.startDate), "MMM d")} - {format(parseISO(item.endDate), "MMM d")}
                  </span>
                </div>
                <div className={styles.itemTimeline} style={{ width: `${totalDays * dayWidth}px` }}>
                  <div
                    className={styles.itemBar}
                    style={{
                      ...getBarStyle(item),
                      borderColor: statusColors[item.status],
                    }}
                    onClick={() => openItemModal(item)}
                  >
                    <div
                      className={styles.itemProgress}
                      style={{
                        width: `${item.progress}%`,
                        backgroundColor: statusColors[item.status],
                      }}
                    />
                    <span className={styles.itemBarLabel}>{item.title}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: "var(--status-draft)" }} />
          Planned
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: "var(--status-active)" }} />
          In Progress
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: "var(--status-completed)" }} />
          Completed
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: "var(--status-blocked)" }} />
          Blocked
        </span>
      </div>

      {/* Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <div className={styles.modalOverlay} onClick={() => setShowItemModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{editingItem ? "Edit Item" : "New Item"}</h2>

              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Item title"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={2}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={itemStartDate}
                    onChange={(e) => setItemStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={itemEndDate}
                    onChange={(e) => setItemEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={itemStatus}
                    onChange={(e) => setItemStatus(e.target.value as RoadmapItem["status"])}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Progress (%)</label>
                  <input
                    type="number"
                    value={itemProgress}
                    onChange={(e) => setItemProgress(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                {editingItem && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => {
                      handleDeleteItem(editingItem.id);
                      setShowItemModal(false);
                    }}
                  >
                    Delete
                  </button>
                )}
                <button className={styles.cancelBtn} onClick={() => setShowItemModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleSaveItem}
                  disabled={!itemTitle.trim()}
                >
                  {editingItem ? "Save" : "Add Item"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Milestone Modal */}
      <AnimatePresence>
        {showMilestoneModal && (
          <div className={styles.modalOverlay} onClick={() => setShowMilestoneModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Add Milestone</h2>

              <div className={styles.formGroup}>
                <label>Milestone Name</label>
                <input
                  type="text"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="e.g., Beta Launch"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Date</label>
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description (optional)</label>
                <textarea
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  placeholder="What does this milestone represent?"
                  rows={2}
                />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowMilestoneModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleAddMilestone}
                  disabled={!milestoneName.trim() || !milestoneDate}
                >
                  Add Milestone
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
