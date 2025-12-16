"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./Canvas.module.css";

interface CanvasNode {
  id: string;
  type: "task" | "note" | "milestone";
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  color: string;
  assignee?: string;
}

interface Container {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export default function Canvas() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState<"task" | "note" | "milestone" | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convex real-time query - uses shared canvas room
  const canvasData = useQuery(api.sharedCanvas.get, { roomId: "default" });

  // Convex mutations
  const initCanvas = useMutation(api.sharedCanvas.init);
  const addNode = useMutation(api.sharedCanvas.addNode);
  const updateNodePosition = useMutation(api.sharedCanvas.updateNodePosition);
  const deleteNode = useMutation(api.sharedCanvas.deleteNode);

  // Initialize canvas if it doesn't exist
  useEffect(() => {
    if (canvasData === null) {
      void initCanvas({ roomId: "default" });
    }
  }, [canvasData, initCanvas]);

  const nodes = canvasData?.nodes || [];
  const containers = canvasData?.containers || [];

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = {
      task: "#00fff2",
      note: "#ffa502",
      milestone: "#7bed9f",
    };

    const newNode: Omit<CanvasNode, "id"> = {
      type: selectedTool,
      position: { x, y },
      size: { width: 200, height: 120 },
      content: selectedTool === "task" ? "مهمة جديدة" : selectedTool === "note" ? "ملاحظة جديدة" : "إنجاز جديد",
      color: colors[selectedTool],
      assignee: user?.name,
    };

    void addNode({
      roomId: "default",
      node: { ...newNode, id: `node-${Date.now()}` },
      editedBy: user?.name || "Anonymous",
    });

    setSelectedTool(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
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

    // Update position locally for smooth dragging
    // Will sync to Convex on mouse up
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

  return (
    <div className={styles.canvasContainer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <h3>إضافة عنصر</h3>
          <div className={styles.toolButtons}>
            <button
              className={`${styles.toolButton} ${selectedTool === "task" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "task" ? null : "task")}
              style={{ borderColor: "#00fff2" }}
            >
              <div className={styles.toolIcon} style={{ backgroundColor: "#00fff2" }} />
              <span>مهمة</span>
            </button>
            <button
              className={`${styles.toolButton} ${selectedTool === "note" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "note" ? null : "note")}
              style={{ borderColor: "#ffa502" }}
            >
              <div className={styles.toolIcon} style={{ backgroundColor: "#ffa502" }} />
              <span>ملاحظة</span>
            </button>
            <button
              className={`${styles.toolButton} ${selectedTool === "milestone" ? styles.active : ""}`}
              onClick={() => setSelectedTool(selectedTool === "milestone" ? null : "milestone")}
              style={{ borderColor: "#7bed9f" }}
            >
              <div className={styles.toolIcon} style={{ backgroundColor: "#7bed9f" }} />
              <span>إنجاز</span>
            </button>
          </div>
        </div>

        {selectedTool && (
          <motion.div
            className={styles.toolHint}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            انقر على اللوحة لإضافة {selectedTool === "task" ? "مهمة" : selectedTool === "note" ? "ملاحظة" : "إنجاز"}
          </motion.div>
        )}

        <div className={styles.toolbarSection}>
          <h3>الإحصائيات</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodes.length}</span>
              <span className={styles.statLabel}>العناصر</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nodes.filter(n => n.assignee).length}</span>
              <span className={styles.statLabel}>موزعة</span>
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
        {/* Grid background */}
        <div className={styles.canvasGrid} />

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              id={node.id}
              className={`${styles.node} ${selectedNode === node.id ? styles.selected : ""}`}
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
            >
              <div className={styles.nodeHeader} style={{ backgroundColor: node.color }}>
                <span className={styles.nodeType}>
                  {node.type === "task" ? "مهمة" : node.type === "note" ? "ملاحظة" : "إنجاز"}
                </span>
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
              <div className={styles.nodeContent}>
                <p>{node.content}</p>
                {node.assignee && (
                  <div className={styles.nodeAssignee}>
                    <span>👤 {node.assignee}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className={styles.emptyState}>
            <h2>لوحة العمل الفارغة</h2>
            <p>ابدأ بإضافة عناصر من الشريط الجانبي</p>
            <div className={styles.emptyHints}>
              <div className={styles.hint}>
                <div className={styles.hintIcon} style={{ backgroundColor: "#00fff2" }}>١</div>
                <span>اختر نوع العنصر</span>
              </div>
              <div className={styles.hint}>
                <div className={styles.hintIcon} style={{ backgroundColor: "#ffa502" }}>٢</div>
                <span>انقر على اللوحة</span>
              </div>
              <div className={styles.hint}>
                <div className={styles.hintIcon} style={{ backgroundColor: "#7bed9f" }}>٣</div>
                <span>اسحب لتحريك</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
