"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./Canvas.module.css";

interface CanvasNode {
  id: string;
  type: "task" | "note" | "milestone" | "decision" | "blocker";
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  color: string;
  assignee?: string;
  priority?: "high" | "medium" | "low";
  connections?: string[]; // IDs of connected nodes
}

interface Container {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const TEAM_MEMBERS = [
  { id: "wahab", name: "وهاب", nameEn: "Wahab", color: "#ff4500" },
  { id: "azeddine", name: "عز الدين", nameEn: "Azeddine", color: "#00b4d8" },
  { id: "sohir", name: "سهير", nameEn: "Sohair", color: "#f4a400" },
  { id: "hythem", name: "هيثم", nameEn: "Hythem", color: "#ff4500" },
  { id: "meamar", name: "معمر", nameEn: "Meamar", color: "#00b4d8" },
];

export default function Canvas() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState<"task" | "note" | "milestone" | "decision" | "blocker" | "container" | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAssigneeMenu, setShowAssigneeMenu] = useState<string | null>(null);
  const [showPriorityMenu, setShowPriorityMenu] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convex real-time query
  const canvasData = useQuery(api.sharedCanvas.get, { roomId: "default" });

  // Convex mutations
  const initCanvas = useMutation(api.sharedCanvas.init);
  const addNode = useMutation(api.sharedCanvas.addNode);
  const updateNode = useMutation(api.sharedCanvas.updateNode);
  const updateNodePosition = useMutation(api.sharedCanvas.updateNodePosition);
  const deleteNode = useMutation(api.sharedCanvas.deleteNode);
  const addContainer = useMutation(api.sharedCanvas.addContainer);

  // Initialize canvas
  useEffect(() => {
    if (canvasData === null) {
      void initCanvas({ roomId: "default" });
    }
  }, [canvasData, initCanvas]);

  const nodes = canvasData?.nodes || [];
  const containers = canvasData?.containers || [];

  const nodeColors = {
    task: "#ff4500",      // vermillion
    note: "#f4a400",      // mustard
    milestone: "#00b4d8", // cyan
    decision: "#8b5cf6",  // purple
    blocker: "#ef4444",   // red
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "container") {
      const newContainer = {
        id: `container-${Date.now()}`,
        name: "مجموعة جديدة",
        color: "#ffffff15",
        position: { x, y },
        size: { width: 400, height: 300 },
      };

      void addContainer({
        roomId: "default",
        container: newContainer,
        editedBy: user?.name || "Anonymous",
      });
    } else {
      const nodeLabels = {
        task: "مهمة جديدة",
        note: "ملاحظة",
        milestone: "إنجاز",
        decision: "قرار",
        blocker: "عائق",
      };

      const newNode: Omit<CanvasNode, "id"> = {
        type: selectedTool,
        position: { x, y },
        size: { width: 220, height: 140 },
        content: nodeLabels[selectedTool],
        color: nodeColors[selectedTool],
        assignee: user?.name,
        priority: "medium",
        connections: [],
      };

      void addNode({
        roomId: "default",
        node: { ...newNode, id: `node-${Date.now()}` },
        editedBy: user?.name || "Anonymous",
      });
    }

    setSelectedTool(null);
  };

  const handleNodeDoubleClick = (node: CanvasNode) => {
    setEditingNode(node.id);
    setEditContent(node.content);
  };

  const handleContentSave = async (nodeId: string) => {
    await updateNode({
      roomId: "default",
      nodeId,
      updates: { content: editContent },
      editedBy: user?.name || "Anonymous",
    });
    setEditingNode(null);
  };

  const handleAssigneeChange = async (nodeId: string, assignee: string) => {
    await updateNode({
      roomId: "default",
      nodeId,
      updates: { assignee },
      editedBy: user?.name || "Anonymous",
    });
    setShowAssigneeMenu(null);
  };

  const handlePriorityChange = async (nodeId: string, priority: "high" | "medium" | "low") => {
    await updateNode({
      roomId: "default",
      nodeId,
      updates: { priority },
      editedBy: user?.name || "Anonymous",
    });
    setShowPriorityMenu(null);
  };

  const handleConnectionStart = (nodeId: string) => {
    if (connectingFrom === nodeId) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  };

  const handleConnectionEnd = async (targetNodeId: string) => {
    if (!connectingFrom || connectingFrom === targetNodeId) {
      setConnectingFrom(null);
      return;
    }

    const sourceNode = nodes.find(n => n.id === connectingFrom) as CanvasNode | undefined;
    if (sourceNode) {
      const newConnections = [...(sourceNode.connections || []), targetNodeId];
      await updateNode({
        roomId: "default",
        nodeId: connectingFrom,
        updates: { connections: newConnections } as any,
        editedBy: user?.name || "Anonymous",
      });
    }

    setConnectingFrom(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (editingNode === nodeId) return;
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setSelectedNode(nodeId);
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - node.position.x,
        y: e.clientY - rect.top - node.position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const nodeElement = document.getElementById(selectedNode);
    if (nodeElement) {
      nodeElement.style.left = `${x}px`;
      nodeElement.style.top = `${y}px`;
    }
  };

  const handleMouseUp = async () => {
    if (isDragging && selectedNode && canvasRef.current) {
      const nodeElement = document.getElementById(selectedNode);
      if (nodeElement) {
        const x = parseInt(nodeElement.style.left);
        const y = parseInt(nodeElement.style.top);

        await updateNodePosition({
          roomId: "default",
          nodeId: selectedNode,
          position: { x, y },
          editedBy: user?.name || "Anonymous",
        });
      }
    }

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDeleteNode = async (nodeId: string) => {
    await deleteNode({
      roomId: "default",
      nodeId,
      editedBy: user?.name || "Anonymous",
    });
    setSelectedNode(null);
  };

  const getNodeIcon = (type: string) => {
    const icons = {
      task: "◉",
      note: "✎",
      milestone: "★",
      decision: "◆",
      blocker: "⬢",
    };
    return icons[type as keyof typeof icons] || "◉";
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      high: "#ef4444",
      medium: "#f4a400",
      low: "#00b4d8",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className={styles.canvasContainer}>
      {/* Enhanced Toolbar */}
      <div className={styles.toolbar}>
        {/* Tools Section */}
        <div className={styles.toolbarSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>01</span>
            <h3>عناصر التخطيط</h3>
          </div>

          <div className={styles.toolButtons}>
            <button
              className={`${styles.toolButton} ${selectedTool === "task" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "task" ? null : "task")}
              title="مهمة - للمهام القابلة للتنفيذ"
            >
              <span className={styles.toolIcon}>◉</span>
              <span className={styles.toolLabel}>مهمة</span>
              <div className={styles.toolColor} style={{ backgroundColor: nodeColors.task }} />
            </button>

            <button
              className={`${styles.toolButton} ${selectedTool === "milestone" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "milestone" ? null : "milestone")}
              title="إنجاز - للأهداف الرئيسية"
            >
              <span className={styles.toolIcon}>★</span>
              <span className={styles.toolLabel}>إنجاز</span>
              <div className={styles.toolColor} style={{ backgroundColor: nodeColors.milestone }} />
            </button>

            <button
              className={`${styles.toolButton} ${selectedTool === "decision" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "decision" ? null : "decision")}
              title="قرار - للقرارات المهمة"
            >
              <span className={styles.toolIcon}>◆</span>
              <span className={styles.toolLabel}>قرار</span>
              <div className={styles.toolColor} style={{ backgroundColor: nodeColors.decision }} />
            </button>

            <button
              className={`${styles.toolButton} ${selectedTool === "blocker" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "blocker" ? null : "blocker")}
              title="عائق - للمشاكل والعوائق"
            >
              <span className={styles.toolIcon}>⬢</span>
              <span className={styles.toolLabel}>عائق</span>
              <div className={styles.toolColor} style={{ backgroundColor: nodeColors.blocker }} />
            </button>

            <button
              className={`${styles.toolButton} ${selectedTool === "note" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "note" ? null : "note")}
              title="ملاحظة - للأفكار والملاحظات"
            >
              <span className={styles.toolIcon}>✎</span>
              <span className={styles.toolLabel}>ملاحظة</span>
              <div className={styles.toolColor} style={{ backgroundColor: nodeColors.note }} />
            </button>
          </div>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {selectedTool && (
            <motion.div
              className={styles.toolHint}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.hintContent}>
                <span className={styles.hintIcon}>→</span>
                <span>انقر على اللوحة لإضافة العنصر</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Mode */}
        <div className={styles.toolbarSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>02</span>
            <h3>الربط والتنظيم</h3>
          </div>

          <div className={styles.connectionInfo}>
            {connectingFrom ? (
              <div className={styles.connectingMode}>
                <span className={styles.connectingIcon}>↗</span>
                <span>انقر على عنصر لربطه</span>
              </div>
            ) : (
              <p className={styles.infoText}>
                انقر على 🔗 في أي عنصر ثم انقر على عنصر آخر لربطهما
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.toolbarSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>03</span>
            <h3>الإحصائيات</h3>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodes.length}</span>
              <span className={styles.statLabel}>عنصر</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodes.filter(n => n.priority === "high").length}</span>
              <span className={styles.statLabel}>عاجل</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodes.filter(n => n.assignee).length}</span>
              <span className={styles.statLabel}>موزع</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodes.filter(n => n.connections?.length).length}</span>
              <span className={styles.statLabel}>مربوط</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.toolbarSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>04</span>
            <h3>اختصارات</h3>
          </div>

          <div className={styles.quickTips}>
            <div className={styles.tip}>
              <span className={styles.tipKey}>نقر مزدوج</span>
              <span className={styles.tipAction}>تعديل النص</span>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipKey}>سحب</span>
              <span className={styles.tipAction}>تحريك</span>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipKey}>🔗</span>
              <span className={styles.tipAction}>ربط العناصر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`${styles.canvas} ${selectedTool ? styles.addingMode : ""}`}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={styles.canvasGrid} />

        {/* Connection Lines */}
        <svg className={styles.connectionsSvg}>
          {nodes.map(node =>
            (node.connections || []).map(targetId => {
              const target = nodes.find(n => n.id === targetId);
              if (!target) return null;

              const startX = node.position.x + node.size.width / 2;
              const startY = node.position.y + node.size.height / 2;
              const endX = target.position.x + target.size.width / 2;
              const endY = target.position.y + target.size.height / 2;

              return (
                <g key={`${node.id}-${targetId}`}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="var(--border-highlight)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                  <circle cx={endX} cy={endY} r="4" fill="var(--vermillion)" />
                </g>
              );
            })
          )}
        </svg>

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              id={node.id}
              className={`${styles.node} ${selectedNode === node.id ? styles.selected : ""} ${connectingFrom === node.id ? styles.connecting : ""}`}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: node.size.width,
                height: node.size.height,
                borderColor: node.color,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
            >
              {/* Node Header */}
              <div className={styles.nodeHeader} style={{ backgroundColor: node.color }}>
                <div className={styles.nodeTypeInfo}>
                  <span className={styles.nodeIcon}>{getNodeIcon(node.type)}</span>
                  <span className={styles.nodeType}>
                    {node.type === "task" ? "مهمة" :
                     node.type === "note" ? "ملاحظة" :
                     node.type === "milestone" ? "إنجاز" :
                     node.type === "decision" ? "قرار" : "عائق"}
                  </span>
                </div>

                <div className={styles.nodeActions}>
                  <button
                    className={styles.nodeAction}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectionStart(node.id);
                    }}
                    title="ربط بعنصر آخر"
                  >
                    🔗
                  </button>
                  <button
                    className={styles.nodeDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Node Content */}
              <div className={styles.nodeContent} onClick={() => connectingFrom && handleConnectionEnd(node.id)}>
                {editingNode === node.id ? (
                  <div className={styles.nodeEdit}>
                    <textarea
                      className={styles.nodeTextarea}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={() => handleContentSave(node.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          handleContentSave(node.id);
                        }
                      }}
                      autoFocus
                    />
                    <span className={styles.editHint}>Ctrl+Enter للحفظ</span>
                  </div>
                ) : (
                  <p>{node.content}</p>
                )}

                {/* Node Footer */}
                <div className={styles.nodeFooter}>
                  {/* Priority Badge */}
                  <div className={styles.nodeMeta}>
                    <button
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(node.priority) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPriorityMenu(showPriorityMenu === node.id ? null : node.id);
                      }}
                    >
                      {node.priority === "high" ? "عاجل" : node.priority === "low" ? "عادي" : "متوسط"}
                    </button>

                    {/* Priority Menu */}
                    {showPriorityMenu === node.id && (
                      <div className={styles.priorityMenu}>
                        <button onClick={() => handlePriorityChange(node.id, "high")}>
                          <span style={{ color: "#ef4444" }}>●</span> عاجل
                        </button>
                        <button onClick={() => handlePriorityChange(node.id, "medium")}>
                          <span style={{ color: "#f4a400" }}>●</span> متوسط
                        </button>
                        <button onClick={() => handlePriorityChange(node.id, "low")}>
                          <span style={{ color: "#00b4d8" }}>●</span> عادي
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Assignee */}
                  <button
                    className={styles.nodeAssignee}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAssigneeMenu(showAssigneeMenu === node.id ? null : node.id);
                    }}
                  >
                    {node.assignee ? (
                      <>
                        <span className={styles.assigneeAvatar}>{node.assignee[0]}</span>
                        <span>{node.assignee}</span>
                      </>
                    ) : (
                      <span className={styles.unassigned}>غير موزع</span>
                    )}
                  </button>

                  {/* Assignee Menu */}
                  {showAssigneeMenu === node.id && (
                    <div className={styles.assigneeMenu}>
                      {TEAM_MEMBERS.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleAssigneeChange(node.id, member.name)}
                          className={styles.assigneeOption}
                        >
                          <span
                            className={styles.assigneeColor}
                            style={{ backgroundColor: member.color }}
                          />
                          {member.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Connection indicator */}
              {node.connections && node.connections.length > 0 && (
                <div className={styles.connectionBadge}>
                  🔗 {node.connections.length}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className={styles.emptyState}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2>لوحة العمل</h2>
              <p>ابدأ التخطيط باختيار عنصر من الشريط الجانبي</p>

              <div className={styles.emptyGrid}>
                <div className={styles.emptyCard}>
                  <span className={styles.emptyNumber}>01</span>
                  <span>اختر نوع العنصر</span>
                </div>
                <div className={styles.emptyCard}>
                  <span className={styles.emptyNumber}>02</span>
                  <span>انقر على اللوحة</span>
                </div>
                <div className={styles.emptyCard}>
                  <span className={styles.emptyNumber}>03</span>
                  <span>عدل واربط العناصر</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
