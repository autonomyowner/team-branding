"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import styles from "./canvas.module.css";

// Shared canvas storage key - all users see the same canvas
const SHARED_CANVAS_KEY = "shared_canvas_data";

interface CanvasNode {
  id: string;
  type: "task" | "note" | "milestone";
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  color: string;
  assignee?: string;
}

interface CanvasContainer {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface CanvasData {
  nodes: CanvasNode[];
  containers: CanvasContainer[];
}

const NODE_TYPES = [
  { type: "task" as const, label: "Task", color: "#00fff2" },
  { type: "note" as const, label: "Note", color: "#ffa502" },
  { type: "milestone" as const, label: "Milestone", color: "#7bed9f" },
];

const CONTAINER_COLORS = [
  { value: "#7bed9f", label: "Green" },
  { value: "#00fff2", label: "Cyan" },
  { value: "#ffa502", label: "Orange" },
  { value: "#ff6b81", label: "Pink" },
  { value: "#8a8a8a", label: "Gray" },
  { value: "#a55eea", label: "Purple" },
  { value: "#45aaf2", label: "Blue" },
  { value: "#f7b731", label: "Yellow" },
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function SharedCanvasPage() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas state
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [containers, setContainers] = useState<CanvasContainer[]>([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingContainerId, setDraggingContainerId] = useState<string | null>(null);

  // Tool state
  const [toolMode, setToolMode] = useState<"select" | "container">("select");
  const [isPanning, setIsPanning] = useState(false);

  // Drawing container
  const [drawingContainer, setDrawingContainer] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Resizing container
  const [resizingContainer, setResizingContainer] = useState<{
    containerId: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Resizing node
  const [resizingNode, setResizingNode] = useState<{
    nodeId: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Node config modal
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [nodeContent, setNodeContent] = useState("");
  const [nodeAssignee, setNodeAssignee] = useState("");

  // Container config modal
  const [showContainerConfig, setShowContainerConfig] = useState(false);
  const [containerName, setContainerName] = useState("");
  const [containerColor, setContainerColor] = useState("#7bed9f");

  // Load shared canvas data
  useEffect(() => {
    const saved = localStorage.getItem(SHARED_CANVAS_KEY);
    if (saved) {
      try {
        const data: CanvasData = JSON.parse(saved);
        setNodes(data.nodes || []);
        setContainers(data.containers || []);
      } catch (e) {
        console.error("Failed to load canvas data");
      }
    }
  }, []);

  // Save shared canvas data
  const saveCanvas = useCallback(() => {
    const data: CanvasData = { nodes, containers };
    localStorage.setItem(SHARED_CANVAS_KEY, JSON.stringify(data));
  }, [nodes, containers]);

  // Auto-save on changes
  useEffect(() => {
    saveCanvas();
  }, [nodes, containers, saveCanvas]);

  // Add node
  const addNode = (type: CanvasNode["type"]) => {
    const nodeType = NODE_TYPES.find((t) => t.type === type);
    const newNode: CanvasNode = {
      id: generateId(),
      type,
      position: {
        x: (300 - viewport.x) / viewport.zoom + Math.random() * 50,
        y: (200 - viewport.y) / viewport.zoom + Math.random() * 50,
      },
      size: { width: 160, height: 80 },
      content: nodeType?.label || "New Item",
      color: nodeType?.color || "#00fff2",
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setNodeContent(newNode.content);
    setNodeAssignee("");
    setShowNodeConfig(true);
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setSelectedNodeId(null);
  };

  // Delete container
  const deleteContainer = (containerId: string) => {
    setContainers((prev) => prev.filter((c) => c.id !== containerId));
    setSelectedContainerId(null);
  };

  // Mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
    } else if (e.button === 0 && toolMode === "container") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        setDrawingContainer({ startX: x, startY: y, currentX: x, currentY: y });
      }
    } else if (e.button === 0) {
      setSelectedNodeId(null);
      setSelectedContainerId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const deltaX = e.movementX / viewport.zoom;
      const deltaY = e.movementY / viewport.zoom;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? { ...node, position: { x: node.position.x + deltaX, y: node.position.y + deltaY } }
            : node
        )
      );
    } else if (draggingContainerId) {
      const deltaX = e.movementX / viewport.zoom;
      const deltaY = e.movementY / viewport.zoom;
      setContainers((prev) =>
        prev.map((c) =>
          c.id === draggingContainerId
            ? { ...c, position: { x: c.position.x + deltaX, y: c.position.y + deltaY } }
            : c
        )
      );
    } else if (resizingContainer && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const currentY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      const deltaX = currentX - resizingContainer.startX;
      const deltaY = currentY - resizingContainer.startY;
      const minSize = 80;

      setContainers((prev) =>
        prev.map((c) => {
          if (c.id !== resizingContainer.containerId) return c;
          const newContainer = { ...c };
          const handle = resizingContainer.handle;

          if (handle.includes("e")) {
            newContainer.size = { ...c.size, width: Math.max(minSize, resizingContainer.startWidth + deltaX) };
          }
          if (handle.includes("w")) {
            const newWidth = Math.max(minSize, resizingContainer.startWidth - deltaX);
            newContainer.position = { ...c.position, x: resizingContainer.startPosX + (resizingContainer.startWidth - newWidth) };
            newContainer.size = { ...c.size, width: newWidth };
          }
          if (handle.includes("s")) {
            newContainer.size = { ...newContainer.size, height: Math.max(minSize, resizingContainer.startHeight + deltaY) };
          }
          if (handle.includes("n")) {
            const newHeight = Math.max(minSize, resizingContainer.startHeight - deltaY);
            newContainer.position = { ...newContainer.position, y: resizingContainer.startPosY + (resizingContainer.startHeight - newHeight) };
            newContainer.size = { ...newContainer.size, height: newHeight };
          }
          return newContainer;
        })
      );
    } else if (resizingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const currentY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      const deltaX = currentX - resizingNode.startX;
      const deltaY = currentY - resizingNode.startY;
      const minWidth = 100;
      const minHeight = 60;

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== resizingNode.nodeId) return node;
          const newNode = { ...node };
          const handle = resizingNode.handle;

          if (handle.includes("e")) {
            newNode.size = { ...node.size, width: Math.max(minWidth, resizingNode.startWidth + deltaX) };
          }
          if (handle.includes("w")) {
            const newWidth = Math.max(minWidth, resizingNode.startWidth - deltaX);
            newNode.position = { ...node.position, x: resizingNode.startPosX + (resizingNode.startWidth - newWidth) };
            newNode.size = { ...node.size, width: newWidth };
          }
          if (handle.includes("s")) {
            newNode.size = { ...newNode.size, height: Math.max(minHeight, resizingNode.startHeight + deltaY) };
          }
          if (handle.includes("n")) {
            const newHeight = Math.max(minHeight, resizingNode.startHeight - deltaY);
            newNode.position = { ...newNode.position, y: resizingNode.startPosY + (resizingNode.startHeight - newHeight) };
            newNode.size = { ...newNode.size, height: newHeight };
          }
          return newNode;
        })
      );
    } else if (drawingContainer && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      setDrawingContainer((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    } else if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (drawingContainer) {
      const { startX, startY, currentX, currentY } = drawingContainer;
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width >= 80 && height >= 80) {
        const newContainer: CanvasContainer = {
          id: generateId(),
          name: "Group",
          color: "#7bed9f",
          position: { x: Math.min(startX, currentX), y: Math.min(startY, currentY) },
          size: { width, height },
        };
        setContainers((prev) => [...prev, newContainer]);
        setSelectedContainerId(newContainer.id);
        setContainerName("Group");
        setContainerColor("#7bed9f");
        setShowContainerConfig(true);
      }
      setDrawingContainer(null);
      setToolMode("select");
    }
    setDraggingNodeId(null);
    setDraggingContainerId(null);
    setResizingContainer(null);
    setResizingNode(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewport.zoom * delta, 0.25), 2);
    setViewport((prev) => ({ ...prev, zoom: newZoom }));
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedContainerId(null);
    setDraggingNodeId(nodeId);
  };

  const handleNodeDoubleClick = (node: CanvasNode) => {
    setSelectedNodeId(node.id);
    setNodeContent(node.content);
    setNodeAssignee(node.assignee || "");
    setShowNodeConfig(true);
  };

  const handleContainerMouseDown = (e: React.MouseEvent, containerId: string) => {
    e.stopPropagation();
    setSelectedContainerId(containerId);
    setSelectedNodeId(null);
    setDraggingContainerId(containerId);
  };

  const handleContainerDoubleClick = (container: CanvasContainer) => {
    setSelectedContainerId(container.id);
    setContainerName(container.name);
    setContainerColor(container.color);
    setShowContainerConfig(true);
  };

  const startResize = (e: React.MouseEvent, containerId: string, handle: string) => {
    e.stopPropagation();
    const container = containers.find((c) => c.id === containerId);
    if (!container || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setResizingContainer({
      containerId,
      handle,
      startX: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      startY: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      startWidth: container.size.width,
      startHeight: container.size.height,
      startPosX: container.position.x,
      startPosY: container.position.y,
    });
  };

  const startNodeResize = (e: React.MouseEvent, nodeId: string, handle: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setResizingNode({
      nodeId,
      handle,
      startX: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      startY: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      startWidth: node.size.width,
      startHeight: node.size.height,
      startPosX: node.position.x,
      startPosY: node.position.y,
    });
  };

  const handleSaveNodeConfig = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? { ...node, content: nodeContent, assignee: nodeAssignee || undefined }
          : node
      )
    );
    setShowNodeConfig(false);
  };

  const handleSaveContainerConfig = () => {
    if (!selectedContainerId) return;
    setContainers((prev) =>
      prev.map((c) =>
        c.id === selectedContainerId ? { ...c, name: containerName, color: containerColor } : c
      )
    );
    setShowContainerConfig(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Delete") {
      if (selectedNodeId) deleteNode(selectedNodeId);
      else if (selectedContainerId) deleteContainer(selectedContainerId);
    }
    if (e.key === "Escape") {
      setSelectedNodeId(null);
      setSelectedContainerId(null);
      setToolMode("select");
      setDrawingContainer(null);
    }
  };

  return (
    <div className={styles.canvasPage} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Team Canvas</h1>
          <span className={styles.badge}>Shared</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.zoomControls}>
            <button onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.2, 2) }))}>+</button>
            <span>{Math.round(viewport.zoom * 100)}%</span>
            <button onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom / 1.2, 0.25) }))}>-</button>
          </div>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Palette */}
        <div className={styles.palette}>
          <h3>Tools</h3>
          <div className={styles.toolButtons}>
            <button
              className={`${styles.toolBtn} ${toolMode === "select" ? styles.active : ""}`}
              onClick={() => setToolMode("select")}
            >
              Select
            </button>
            <button
              className={`${styles.toolBtn} ${toolMode === "container" ? styles.active : ""}`}
              onClick={() => setToolMode("container")}
            >
              Container
            </button>
          </div>

          <h3>Add Items</h3>
          <div className={styles.nodeTypes}>
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.type}
                className={styles.nodeTypeBtn}
                onClick={() => addNode(nodeType.type)}
              >
                <span className={styles.nodeTypeDot} style={{ backgroundColor: nodeType.color }} />
                {nodeType.label}
              </button>
            ))}
          </div>

          <div className={styles.paletteHelp}>
            <p>Click to add item</p>
            <p>Double-click to edit</p>
            <p>Shift+drag to pan</p>
            <p>Scroll to zoom</p>
            <p>Delete to remove</p>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`${styles.canvas} ${isPanning ? styles.panning : ""} ${toolMode === "container" ? styles.drawingMode : ""}`}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          <div
            className={styles.canvasContent}
            style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
          >
            <div className={styles.grid} />

            {/* Containers */}
            {containers.map((container) => (
              <div
                key={container.id}
                className={`${styles.container} ${selectedContainerId === container.id ? styles.selected : ""}`}
                style={{
                  left: container.position.x,
                  top: container.position.y,
                  width: container.size.width,
                  height: container.size.height,
                  backgroundColor: `${container.color}33`,
                  borderColor: container.color,
                }}
                onMouseDown={(e) => handleContainerMouseDown(e, container.id)}
                onDoubleClick={() => handleContainerDoubleClick(container)}
              >
                <div className={styles.containerLabel}>{container.name}</div>
                {selectedContainerId === container.id && (
                  <>
                    <div className={`${styles.resizeHandle} ${styles.resizeN}`} onMouseDown={(e) => startResize(e, container.id, "n")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeS}`} onMouseDown={(e) => startResize(e, container.id, "s")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeE}`} onMouseDown={(e) => startResize(e, container.id, "e")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeW}`} onMouseDown={(e) => startResize(e, container.id, "w")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSE}`} onMouseDown={(e) => startResize(e, container.id, "se")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSW}`} onMouseDown={(e) => startResize(e, container.id, "sw")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNE}`} onMouseDown={(e) => startResize(e, container.id, "ne")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNW}`} onMouseDown={(e) => startResize(e, container.id, "nw")} />
                    <button className={styles.deleteBtn} onClick={() => deleteContainer(container.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Drawing preview */}
            {drawingContainer && (
              <div
                className={styles.drawingPreview}
                style={{
                  left: Math.min(drawingContainer.startX, drawingContainer.currentX),
                  top: Math.min(drawingContainer.startY, drawingContainer.currentY),
                  width: Math.abs(drawingContainer.currentX - drawingContainer.startX),
                  height: Math.abs(drawingContainer.currentY - drawingContainer.startY),
                }}
              />
            )}

            {/* Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`${styles.node} ${selectedNodeId === node.id ? styles.selected : ""}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: node.size?.width || 160,
                  height: node.size?.height || 80,
                  borderColor: node.color,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={() => handleNodeDoubleClick(node)}
              >
                <div className={styles.nodeHeader} style={{ backgroundColor: node.color }}>
                  {node.type}
                </div>
                <div className={styles.nodeBody}>
                  <span className={styles.nodeContent}>{node.content}</span>
                  {node.assignee && <span className={styles.nodeAssignee}>{node.assignee}</span>}
                </div>
                {selectedNodeId === node.id && (
                  <>
                    <div className={`${styles.resizeHandle} ${styles.resizeN}`} onMouseDown={(e) => startNodeResize(e, node.id, "n")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeS}`} onMouseDown={(e) => startNodeResize(e, node.id, "s")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeE}`} onMouseDown={(e) => startNodeResize(e, node.id, "e")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeW}`} onMouseDown={(e) => startNodeResize(e, node.id, "w")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSE}`} onMouseDown={(e) => startNodeResize(e, node.id, "se")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSW}`} onMouseDown={(e) => startNodeResize(e, node.id, "sw")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNE}`} onMouseDown={(e) => startNodeResize(e, node.id, "ne")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNW}`} onMouseDown={(e) => startNodeResize(e, node.id, "nw")} />
                    <button className={styles.deleteBtn} onClick={() => deleteNode(node.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}

            {nodes.length === 0 && containers.length === 0 && (
              <div className={styles.canvasEmpty}>
                <p>Add items from the palette to start planning</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Config Modal */}
      <AnimatePresence>
        {showNodeConfig && (
          <div className={styles.modalOverlay} onClick={() => setShowNodeConfig(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Edit Item</h2>
              <div className={styles.formGroup}>
                <label>Content</label>
                <input
                  type="text"
                  value={nodeContent}
                  onChange={(e) => setNodeContent(e.target.value)}
                  autoFocus
                  placeholder="What needs to be done?"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Assignee (optional)</label>
                <input
                  type="text"
                  value={nodeAssignee}
                  onChange={(e) => setNodeAssignee(e.target.value)}
                  placeholder="Who is responsible?"
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowNodeConfig(false)}>Cancel</button>
                <button className={styles.submitBtn} onClick={handleSaveNodeConfig}>Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Container Config Modal */}
      <AnimatePresence>
        {showContainerConfig && (
          <div className={styles.modalOverlay} onClick={() => setShowContainerConfig(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Edit Container</h2>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                  autoFocus
                  placeholder="Group name..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Color</label>
                <div className={styles.colorGrid}>
                  {CONTAINER_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`${styles.colorOption} ${containerColor === color.value ? styles.selectedColor : ""}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setContainerColor(color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowContainerConfig(false)}>Cancel</button>
                <button className={styles.submitBtn} onClick={handleSaveContainerConfig}>Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
