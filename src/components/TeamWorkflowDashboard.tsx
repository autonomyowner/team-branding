// @ts-nocheck - Temporary: implicit any types in callbacks
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./TeamWorkflowDashboard.module.css";

interface TeamMember {
  id: string;
  name: string;
  nameAr: string;
  initials: string;
  role: string;
  roleAr: string;
  department: string;
  departmentAr: string;
  color: string;
}

interface Task {
  id: string;
  text: string;
  textAr: string;
  owner: string;
  completed: boolean;
}

interface Phase {
  id: string;
  number: string;
  title: string;
  titleAr: string;
  status: "pending" | "in_progress" | "complete";
  tasks: Task[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "wahab",
    name: "Wahab",
    nameAr: "وهاب",
    initials: "وه",
    role: "Product Manager",
    roleAr: "مدير المنتج",
    department: "Management",
    departmentAr: "الإدارة",
    color: "#3b82f6"
  },
  {
    id: "azeddine",
    name: "Azeddine",
    nameAr: "عز الدين",
    initials: "عز",
    role: "Tech",
    roleAr: "تقني",
    department: "Tech",
    departmentAr: "التقنية",
    color: "#10b981"
  },
  {
    id: "sohir",
    name: "Sohir",
    nameAr: "سهير",
    initials: "سه",
    role: "Creative Lead",
    roleAr: "قائدة الإبداع",
    department: "Brand & Content",
    departmentAr: "العلامة والمحتوى",
    color: "#ec4899"
  },
  {
    id: "hythem",
    name: "Hythem",
    nameAr: "هيثم",
    initials: "هي",
    role: "Content Creator",
    roleAr: "صانع المحتوى",
    department: "Brand & Content",
    departmentAr: "العلامة والمحتوى",
    color: "#f59e0b"
  },
  {
    id: "meamar",
    name: "Meamar",
    nameAr: "معمر",
    initials: "مع",
    role: "Sales & Branding",
    roleAr: "المبيعات والعلامة التجارية",
    department: "Sales + Brand",
    departmentAr: "المبيعات + العلامة",
    color: "#8b5cf6"
  },
];

const INITIAL_PHASES: Phase[] = [
  {
    id: "phase1",
    number: "٠١",
    title: "Brand Foundation",
    titleAr: "أساس العلامة التجارية",
    status: "in_progress",
    tasks: [
      { id: "t1", text: "Define brand name and tagline", textAr: "تحديد اسم العلامة والشعار", owner: "الكل", completed: false },
      { id: "t2", text: "Create brand guidelines document", textAr: "إنشاء دليل العلامة التجارية", owner: "سه/هي", completed: false },
      { id: "t3", text: "Design logo variations", textAr: "تصميم تنويعات الشعار", owner: "سه/هي", completed: false },
      { id: "t4", text: "Develop brand positioning", textAr: "تطوير موقع العلامة التجارية", owner: "مع", completed: false },
      { id: "t5", text: "Define product offerings", textAr: "تحديد عروض المنتجات", owner: "وه", completed: false },
    ],
  },
  {
    id: "phase2",
    number: "٠٢",
    title: "Build & Create",
    titleAr: "البناء والإنشاء",
    status: "pending",
    tasks: [
      { id: "t6", text: "Set up development environment", textAr: "إعداد بيئة التطوير", owner: "عز", completed: false },
      { id: "t7", text: "Build MVP product", textAr: "بناء المنتج الأولي", owner: "عز", completed: false },
      { id: "t8", text: "Create social media accounts", textAr: "إنشاء حسابات التواصل الاجتماعي", owner: "سه/هي", completed: false },
      { id: "t9", text: "Develop content calendar", textAr: "تطوير تقويم المحتوى", owner: "سه/هي", completed: false },
      { id: "t10", text: "Prepare Flippa listings", textAr: "إعداد قوائم Flippa", owner: "مع", completed: false },
    ],
  },
  {
    id: "phase3",
    number: "٠٣",
    title: "Launch & Scale",
    titleAr: "الإطلاق والتوسع",
    status: "pending",
    tasks: [
      { id: "t11", text: "Deploy production servers", textAr: "نشر خوادم الإنتاج", owner: "عز", completed: false },
      { id: "t12", text: "Launch social media campaign", textAr: "إطلاق حملة التواصل الاجتماعي", owner: "سه/هي", completed: false },
      { id: "t13", text: "Activate Flippa listings", textAr: "تفعيل قوائم Flippa", owner: "مع", completed: false },
      { id: "t14", text: "Monitor KPIs and metrics", textAr: "مراقبة مؤشرات الأداء", owner: "وه", completed: false },
      { id: "t15", text: "Iterate based on feedback", textAr: "التحسين بناءً على الملاحظات", owner: "الكل", completed: false },
    ],
  },
];

const STORAGE_KEY = "team-workflow-state-ar";

export default function TeamWorkflowDashboard() {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "schedule">("overview");
  const [addingTaskToPhase, setAddingTaskToPhase] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("الكل");
  const [editingTask, setEditingTask] = useState<{ phaseId: string; taskId: string } | null>(null);
  const [editTaskText, setEditTaskText] = useState("");

  // Convex real-time query - auto-updates when data changes
  const workflowData = useQuery(api.teamWorkflow.queries.get, { workspaceId: undefined });

  // Convex mutations
  const initializeWorkflow = useMutation(api.teamWorkflow.mutations.initialize);
  const updatePhasesMutation = useMutation(api.teamWorkflow.mutations.updatePhases);
  const updateTaskStatusMutation = useMutation(api.teamWorkflow.mutations.updateTaskStatus);
  const addTaskMutation = useMutation(api.teamWorkflow.mutations.addTask);
  const updateTaskMutation = useMutation(api.teamWorkflow.mutations.updateTask);
  const deleteTaskMutation = useMutation(api.teamWorkflow.mutations.deleteTask);

  // Initialize workflow if it doesn't exist
  useEffect(() => {
    if (workflowData === null) {
      // No workflow exists yet, create initial one
      void initializeWorkflow({
        workspaceId: undefined,
        phases: INITIAL_PHASES,
      });
    }
  }, [workflowData, initializeWorkflow]);

  // Use data from Convex or fallback to initial
  const phases = workflowData?.phases || INITIAL_PHASES;

  const toggleTask = async (phaseId: string, taskId: string) => {
    if (!workflowData) return;

    // Find current task status
    const phase = phases.find((p) => p.id === phaseId);
    const task = phase?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Toggle task status in Convex
    await updateTaskStatusMutation({
      workflowId: workflowData._id,
      phaseId,
      taskId,
      completed: !task.completed,
      editedBy: user?.name || "Anonymous",
    });

    // Data will auto-update via Convex real-time query
  };

  const handleAddTask = async (phaseId: string) => {
    if (!workflowData || !newTaskText.trim()) return;

    await addTaskMutation({
      workflowId: workflowData._id,
      phaseId,
      task: {
        text: newTaskText.trim(),
        textAr: newTaskText.trim(),
        owner: newTaskOwner,
      },
      editedBy: user?.name || "Anonymous",
    });

    // Reset form
    setNewTaskText("");
    setNewTaskOwner("الكل");
    setAddingTaskToPhase(null);
  };

  const handleEditTask = async (phaseId: string, taskId: string) => {
    if (!workflowData || !editTaskText.trim()) return;

    await updateTaskMutation({
      workflowId: workflowData._id,
      phaseId,
      taskId,
      updates: {
        text: editTaskText.trim(),
        textAr: editTaskText.trim(),
      },
      editedBy: user?.name || "Anonymous",
    });

    setEditingTask(null);
    setEditTaskText("");
  };

  const handleDeleteTask = async (phaseId: string, taskId: string) => {
    if (!workflowData) return;

    await deleteTaskMutation({
      workflowId: workflowData._id,
      phaseId,
      taskId,
      editedBy: user?.name || "Anonymous",
    });
  };

  const startEditing = (phaseId: string, task: Task) => {
    setEditingTask({ phaseId, taskId: task.id });
    setEditTaskText(task.textAr);
  };

  const getPhaseProgress = (phase: Phase) => {
    const completed = phase.tasks.filter((t) => t.completed).length;
    return Math.round((completed / phase.tasks.length) * 100);
  };

  const getTotalProgress = () => {
    const allTasks = phases.flatMap((p) => p.tasks);
    const completed = allTasks.filter((t) => t.completed).length;
    return Math.round((completed / allTasks.length) * 100);
  };

  const getStatusBadge = (status: Phase["status"]) => {
    switch (status) {
      case "complete":
        return { text: "مكتمل", class: styles.badgeComplete };
      case "in_progress":
        return { text: "جاري العمل", class: styles.badgeProgress };
      default:
        return { text: "قيد الانتظار", class: styles.badgePending };
    }
  };

  const getMemberColor = (owner: string) => {
    const member = TEAM_MEMBERS.find(
      (m) => owner.includes(m.initials) || owner === "الكل"
    );
    return member?.color || "#6b7280";
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerMain}>
            <h1 className={styles.title}>سير عمل الفريق</h1>
            <p className={styles.subtitle}>إطلاق العلامة التجارية - التوسع في السوق المستهدف</p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{getTotalProgress()}%</span>
              <span className={styles.statLabel}>التقدم الكلي</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{phases.filter((p) => p.status === "complete").length}/{phases.length}</span>
              <span className={styles.statLabel}>المراحل المكتملة</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.totalProgress}>
          <div className={styles.progressBar}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${getTotalProgress()}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "overview" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          نظرة عامة
        </button>
        <button
          className={`${styles.tab} ${activeTab === "team" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("team")}
        >
          الفريق
        </button>
        <button
          className={`${styles.tab} ${activeTab === "schedule" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          الجدول
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.overviewContent}
            >
              {/* Team Members Bar */}
              <div className={styles.teamBar}>
                <span className={styles.teamBarLabel}>الفريق</span>
                <div className={styles.teamAvatars}>
                  {TEAM_MEMBERS.map((member) => (
                    <button
                      key={member.id}
                      className={`${styles.memberAvatar} ${selectedMember === member.id ? styles.selected : ""}`}
                      style={{ backgroundColor: member.color }}
                      onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                      title={`${member.nameAr} - ${member.roleAr}`}
                    >
                      {member.initials}
                    </button>
                  ))}
                </div>
                {selectedMember && (
                  <button className={styles.clearFilter} onClick={() => setSelectedMember(null)}>
                    مسح الفلتر
                  </button>
                )}
              </div>

              {/* Phases Grid */}
              <div className={styles.phasesGrid}>
                {phases.map((phase, index) => {
                  const badge = getStatusBadge(phase.status);
                  const progress = getPhaseProgress(phase);

                  return (
                    <motion.div
                      key={phase.id}
                      className={styles.phaseCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={styles.phaseHeader}>
                        <div>
                          <span className={styles.phaseNumber}>المرحلة {phase.number}</span>
                          <h3 className={styles.phaseTitle}>{phase.titleAr}</h3>
                        </div>
                        <span className={`${styles.phaseBadge} ${badge.class}`}>{badge.text}</span>
                      </div>

                      <div className={styles.taskList}>
                        {phase.tasks
                          .filter((task) => {
                            if (!selectedMember) return true;
                            const member = TEAM_MEMBERS.find((m) => m.id === selectedMember);
                            if (!member) return true;
                            return task.owner.includes(member.initials) || task.owner === "الكل";
                          })
                          .map((task) => (
                            <div
                              key={task.id}
                              className={`${styles.taskItem} ${task.completed ? styles.completed : ""}`}
                            >
                              <div
                                className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
                                onClick={() => toggleTask(phase.id, task.id)}
                              >
                                {task.completed && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              {editingTask?.phaseId === phase.id && editingTask?.taskId === task.id ? (
                                <>
                                  <input
                                    type="text"
                                    value={editTaskText}
                                    onChange={(e) => setEditTaskText(e.target.value)}
                                    className={styles.editTaskInput}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleEditTask(phase.id, task.id);
                                      } else if (e.key === "Escape") {
                                        setEditingTask(null);
                                        setEditTaskText("");
                                      }
                                    }}
                                  />
                                  <button
                                    className={styles.addTaskBtn}
                                    onClick={() => handleEditTask(phase.id, task.id)}
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    className={styles.cancelBtn}
                                    onClick={() => {
                                      setEditingTask(null);
                                      setEditTaskText("");
                                    }}
                                  >
                                    إلغاء
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className={styles.taskText}>{task.textAr}</span>
                                  <span
                                    className={styles.taskOwner}
                                    style={{ backgroundColor: `${getMemberColor(task.owner)}20`, color: getMemberColor(task.owner) }}
                                  >
                                    {task.owner}
                                  </span>
                                  <div className={styles.taskActions}>
                                    <button
                                      className={styles.taskActionBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(phase.id, task);
                                      }}
                                      title="تعديل"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                    <button
                                      className={`${styles.taskActionBtn} ${styles.deleteBtn}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(phase.id, task.id);
                                      }}
                                      title="حذف"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                        {/* Add Task Form */}
                        {addingTaskToPhase === phase.id ? (
                          <div className={styles.addTaskForm}>
                            <input
                              type="text"
                              value={newTaskText}
                              onChange={(e) => setNewTaskText(e.target.value)}
                              placeholder="اكتب المهمة الجديدة..."
                              className={styles.addTaskInput}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddTask(phase.id);
                                } else if (e.key === "Escape") {
                                  setAddingTaskToPhase(null);
                                  setNewTaskText("");
                                }
                              }}
                            />
                            <select
                              value={newTaskOwner}
                              onChange={(e) => setNewTaskOwner(e.target.value)}
                              className={styles.ownerSelect}
                            >
                              <option value="الكل">الكل</option>
                              {TEAM_MEMBERS.map((member) => (
                                <option key={member.id} value={member.initials}>
                                  {member.nameAr}
                                </option>
                              ))}
                            </select>
                            <button
                              className={styles.addTaskBtn}
                              onClick={() => handleAddTask(phase.id)}
                              disabled={!newTaskText.trim()}
                            >
                              إضافة
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={() => {
                                setAddingTaskToPhase(null);
                                setNewTaskText("");
                              }}
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            className={styles.addTaskTrigger}
                            onClick={() => setAddingTaskToPhase(phase.id)}
                          >
                            + إضافة مهمة جديدة
                          </button>
                        )}
                      </div>

                      <div className={styles.phaseProgress}>
                        <div className={styles.progressHeader}>
                          <span>التقدم</span>
                          <span>{progress}%</span>
                        </div>
                        <div className={styles.progressBarSmall}>
                          <motion.div
                            className={styles.progressFillSmall}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.teamContent}
            >
              <div className={styles.teamGrid}>
                {TEAM_MEMBERS.map((member, index) => (
                  <motion.div
                    key={member.id}
                    className={styles.teamCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={styles.teamCardHeader}>
                      <div className={styles.teamCardAvatar} style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}dd)` }}>
                        {member.initials}
                      </div>
                      <div className={styles.teamCardInfo}>
                        <h3>{member.nameAr}</h3>
                        <p>{member.roleAr}</p>
                      </div>
                    </div>
                    <div className={styles.teamCardDept}>
                      <span>القسم</span>
                      <span>{member.departmentAr}</span>
                    </div>
                    <div className={styles.teamCardResponsibilities}>
                      <span className={styles.respLabel}>المسؤوليات الرئيسية</span>
                      <ul>
                        {getResponsibilities(member.id).map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.scheduleContent}
            >
              <div className={styles.scheduleGrid}>
                {[
                  { day: "الإثنين", label: "تحديثات" },
                  { day: "الثلاثاء", label: "تحديثات" },
                  { day: "الأربعاء", label: "اجتماع الفريق", isMeeting: true },
                  { day: "الخميس", label: "تحديثات" },
                  { day: "الجمعة", label: "تحديثات" },
                  { day: "السبت", label: "اختياري" },
                  { day: "الأحد", label: "راحة" },
                ].map((item, index) => (
                  <div
                    key={item.day}
                    className={`${styles.scheduleDay} ${item.isMeeting ? styles.meetingDay : ""}`}
                  >
                    <span className={styles.dayName}>{item.day}</span>
                    <span className={styles.dayLabel}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.meetingCard}>
                <h3>اجتماع الفريق الأسبوعي</h3>
                <div className={styles.meetingDetails}>
                  <div className={styles.meetingDetail}>
                    <span>اليوم</span>
                    <span>الأربعاء</span>
                  </div>
                  <div className={styles.meetingDetail}>
                    <span>المدة</span>
                    <span>٣٠-٦٠ دقيقة</span>
                  </div>
                  <div className={styles.meetingDetail}>
                    <span>جدول الأعمال</span>
                    <span>تحديثات التقدم، العوائق، الأولويات</span>
                  </div>
                </div>
              </div>

              <div className={styles.communicationCard}>
                <h3>إرشادات التواصل</h3>
                <ul>
                  <li>تحديثات يومية عبر محادثة الفريق</li>
                  <li>اجتماع أسبوعي يوم الأربعاء</li>
                  <li>مراجعة استراتيجية شهرية</li>
                  <li>استخدام التعليقات للمناقشات التفصيلية</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getResponsibilities(memberId: string): string[] {
  const responsibilities: Record<string, string[]> = {
    wahab: [
      "تحديد استراتيجية المنتج وخارطة الطريق",
      "تنسيق أنشطة الفريق",
      "اتخاذ قرارات العمل الرئيسية",
      "تتبع مؤشرات الأداء والنجاح",
    ],
    azeddine: [
      "بناء منتجات SaaS",
      "تطوير المواقع والتطبيقات",
      "إعداد البنية التحتية",
      "التوثيق التقني",
    ],
    sohir: [
      "قيادة تصميم هوية العلامة",
      "إنشاء الإرشادات البصرية",
      "تصميم محتوى التواصل الاجتماعي",
      "الإشراف على التوجه الإبداعي",
    ],
    hythem: [
      "إنشاء محتوى التواصل الاجتماعي",
      "كتابة نصوص جذابة",
      "إدارة تقويم المحتوى",
      "إنتاج محتوى الفيديو",
    ],
    meamar: [
      "بيع المنتجات على Flippa",
      "تطوير موقع العلامة التجارية",
      "إنشاء نصوص المبيعات والعروض",
      "أبحاث وتحليل السوق",
    ],
  };

  return responsibilities[memberId] || [];
}
