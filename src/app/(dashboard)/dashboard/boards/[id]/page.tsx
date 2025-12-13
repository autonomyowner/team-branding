"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCollaboration } from "@/context/CollaborationContext";
import { KanbanTask, KanbanColumn, Priority } from "@/types/collaboration";
import styles from "./board.module.css";

// Sortable Task Card Component
function SortableTaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors: Record<Priority, string> = {
    critical: "var(--priority-critical)",
    high: "var(--priority-high)",
    medium: "var(--priority-medium)",
    low: "var(--priority-low)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.taskCard}
      {...attributes}
      {...listeners}
    >
      <div className={styles.taskHeader}>
        <span
          className={styles.priorityDot}
          style={{ backgroundColor: priorityColors[task.priority] }}
          title={task.priority}
        />
        <div className={styles.taskActions}>
          <button onClick={onEdit} className={styles.taskActionBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} className={styles.taskActionBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <h4 className={styles.taskTitle}>{task.title}</h4>
      {task.description && (
        <p className={styles.taskDescription}>{task.description}</p>
      )}
      <div className={styles.taskFooter}>
        {task.dueDate && (
          <span className={styles.dueDate}>
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {task.storyPoints && (
          <span className={styles.storyPoints}>{task.storyPoints} pts</span>
        )}
        {task.assigneeName && (
          <span className={styles.assignee}>
            {task.assigneeName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// Task Card for Drag Overlay
function TaskCard({ task }: { task: KanbanTask }) {
  const priorityColors: Record<Priority, string> = {
    critical: "var(--priority-critical)",
    high: "var(--priority-high)",
    medium: "var(--priority-medium)",
    low: "var(--priority-low)",
  };

  return (
    <div className={`${styles.taskCard} ${styles.dragging}`}>
      <div className={styles.taskHeader}>
        <span
          className={styles.priorityDot}
          style={{ backgroundColor: priorityColors[task.priority] }}
        />
      </div>
      <h4 className={styles.taskTitle}>{task.title}</h4>
    </div>
  );
}

// Column Component
function KanbanColumnComponent({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
}: {
  column: KanbanColumn;
  tasks: KanbanTask[];
  onAddTask: () => void;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: () => void;
  onDeleteColumn: () => void;
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const isOverLimit = column.taskLimit && tasks.length >= column.taskLimit;

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>
          <h3>{column.name}</h3>
          <span className={`${styles.taskCount} ${isOverLimit ? styles.overLimit : ""}`}>
            {tasks.length}
            {column.taskLimit && `/${column.taskLimit}`}
          </span>
        </div>
        <div className={styles.columnActions}>
          <button onClick={onEditColumn} className={styles.columnActionBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className={styles.columnContent}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </SortableContext>

      <button className={styles.addTaskBtn} onClick={onAddTask}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Task
      </button>
    </div>
  );
}

export default function BoardViewPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const {
    boards,
    tasks,
    loadBoards,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
    updateColumn,
    deleteColumn,
    updateBoard,
  } = useCollaboration();

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPoints, setTaskPoints] = useState("");

  // Column form state
  const [columnName, setColumnName] = useState("");
  const [columnLimit, setColumnLimit] = useState("");

  const board = boards.find((b) => b.id === boardId);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (boardId) {
      loadTasks(boardId);
    }
  }, [boardId, loadTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByColumn = (columnId: string) => {
    return tasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropping over a column
    const overColumn = board?.columns.find((c) => c.id === over.id);
    if (overColumn && activeTask.columnId !== overColumn.id) {
      const columnTasks = getTasksByColumn(overColumn.id);
      moveTask(activeTask.id, overColumn.id, columnTasks.length);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask) return;

    if (overTask && activeTask.columnId === overTask.columnId) {
      // Reorder within same column
      const columnTasks = getTasksByColumn(activeTask.columnId);
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== newIndex) {
        moveTask(activeTask.id, activeTask.columnId, newIndex);
      }
    } else if (overTask) {
      // Move to different column at specific position
      const columnTasks = getTasksByColumn(overTask.columnId);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);
      moveTask(activeTask.id, overTask.columnId, newIndex);
    }
  };

  const openTaskModal = (columnId: string, task?: KanbanTask) => {
    setSelectedColumnId(columnId);
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setTaskPriority(task.priority);
      setTaskDueDate(task.dueDate || "");
      setTaskPoints(task.storyPoints?.toString() || "");
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setTaskPoints("");
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim() || !selectedColumnId) return;

    const columnTasks = getTasksByColumn(selectedColumnId);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        storyPoints: taskPoints ? parseInt(taskPoints) : undefined,
      });
    } else {
      createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        columnId: selectedColumnId,
        boardId: boardId,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        storyPoints: taskPoints ? parseInt(taskPoints) : undefined,
        position: columnTasks.length,
        labels: [],
        comments: [],
        checklists: [],
        attachments: [],
      });
    }

    setShowTaskModal(false);
    loadTasks(boardId);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Delete this task?")) {
      deleteTask(taskId);
      loadTasks(boardId);
    }
  };

  const openColumnModal = (column?: KanbanColumn) => {
    if (column) {
      setEditingColumn(column);
      setColumnName(column.name);
      setColumnLimit(column.taskLimit?.toString() || "");
    } else {
      setEditingColumn(null);
      setColumnName("");
      setColumnLimit("");
    }
    setShowColumnModal(true);
  };

  const handleSaveColumn = () => {
    if (!columnName.trim()) return;

    if (editingColumn) {
      updateColumn(boardId, editingColumn.id, {
        name: columnName.trim(),
        taskLimit: columnLimit ? parseInt(columnLimit) : undefined,
      });
    } else {
      addColumn(boardId, columnName.trim(), columnLimit ? parseInt(columnLimit) : undefined);
    }

    setShowColumnModal(false);
    loadBoards();
  };

  const handleDeleteColumn = (columnId: string) => {
    const columnTasks = getTasksByColumn(columnId);
    if (columnTasks.length > 0) {
      if (!confirm("This column has tasks. Delete anyway?")) return;
    }
    deleteColumn(boardId, columnId);
    loadBoards();
    loadTasks(boardId);
  };

  if (!board) {
    return (
      <div className={styles.loading}>
        <p>Loading board...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/boards" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Boards
          </Link>
          <span className={styles.separator}>/</span>
          <h1>{board.name}</h1>
        </div>
        <button className={styles.addColumnBtn} onClick={() => openColumnModal()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Column
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          {board.columns
            .sort((a, b) => a.position - b.position)
            .map((column) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                tasks={getTasksByColumn(column.id)}
                onAddTask={() => openTaskModal(column.id)}
                onEditTask={(task) => openTaskModal(column.id, task)}
                onDeleteTask={handleDeleteTask}
                onEditColumn={() => openColumnModal(column)}
                onDeleteColumn={() => handleDeleteColumn(column.id)}
              />
            ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className={styles.modalOverlay} onClick={() => setShowTaskModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{editingTask ? "Edit Task" : "New Task"}</h2>

              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Points</label>
                  <input
                    type="number"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleSaveTask}
                  disabled={!taskTitle.trim()}
                >
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Column Modal */}
      <AnimatePresence>
        {showColumnModal && (
          <div className={styles.modalOverlay} onClick={() => setShowColumnModal(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{editingColumn ? "Edit Column" : "New Column"}</h2>

              <div className={styles.formGroup}>
                <label>Column Name</label>
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="e.g., In Review"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>WIP Limit (optional)</label>
                <input
                  type="number"
                  value={columnLimit}
                  onChange={(e) => setColumnLimit(e.target.value)}
                  placeholder="No limit"
                  min="1"
                />
              </div>

              <div className={styles.modalActions}>
                {editingColumn && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => {
                      handleDeleteColumn(editingColumn.id);
                      setShowColumnModal(false);
                    }}
                  >
                    Delete Column
                  </button>
                )}
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowColumnModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleSaveColumn}
                  disabled={!columnName.trim()}
                >
                  {editingColumn ? "Save" : "Add Column"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
