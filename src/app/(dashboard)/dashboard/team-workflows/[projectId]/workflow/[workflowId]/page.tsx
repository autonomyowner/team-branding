"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamWorkflow } from "@/context/TeamWorkflowContext";
import { useAuth } from "@/context/AuthContext";
import {
  EnhancedWorkflowNode,
  EnhancedWorkflowEdge,
  EnhancedNodeType,
  WorkflowContainer,
} from "@/types/collaboration";
import { generateId } from "@/services/teamWorkflowService";
import styles from "./editor.module.css";

const NODE_TYPES: { type: EnhancedNodeType; label: string; color: string }[] = [
  { type: "trigger", label: "Trigger", color: "#7bed9f" },
  { type: "action", label: "Action", color: "#00fff2" },
  { type: "condition", label: "Condition", color: "#ffa502" },
  { type: "delay", label: "Delay", color: "#8a8a8a" },
  { type: "loop", label: "Loop", color: "#7bed9f" },
  { type: "integration", label: "Integration", color: "#ffa502" },
  { type: "transform", label: "Transform", color: "#00b8ad" },
  { type: "end", label: "End", color: "#ff4757" },
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

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const workflowId = params.workflowId as string;

  const { user } = useAuth();
  const {
    workflows,
    loadWorkflows,
    setCurrentWorkflow,
    saveWorkflow,
    updateWorkflow,
    phantomPresences,
    startPresenceSimulation,
    stopPresenceSimulation,
  } = useTeamWorkflow();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<EnhancedWorkflowNode[]>([]);
  const [edges, setEdges] = useState<EnhancedWorkflowEdge[]>([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; handleId: string } | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasChanges, setHasChanges] = useState(false);

  // Node config state
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeDescription, setNodeDescription] = useState("");

  // Container state
  const [containers, setContainers] = useState<WorkflowContainer[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [draggingContainerId, setDraggingContainerId] = useState<string | null>(null);
  const [resizingContainer, setResizingContainer] = useState<{
    containerId: string;
    handle: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const [toolMode, setToolMode] = useState<"select" | "container">("select");
  const [drawingContainer, setDrawingContainer] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [showContainerConfig, setShowContainerConfig] = useState(false);
  const [containerName, setContainerName] = useState("");
  const [containerColor, setContainerColor] = useState("#7bed9f");

  const workflow = useMemo(() => workflows.find((w) => w.id === workflowId), [workflows, workflowId]);

  useEffect(() => {
    loadWorkflows(projectId);
  }, [loadWorkflows, projectId]);

  useEffect(() => {
    if (workflow) {
      setCurrentWorkflow(workflow);
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
      setContainers(workflow.containers || []);
      setViewport(workflow.viewport);
      startPresenceSimulation(projectId, undefined, workflowId);
    }

    return () => {
      stopPresenceSimulation();
    };
  }, [workflow, projectId, workflowId, setCurrentWorkflow, startPresenceSimulation, stopPresenceSimulation]);

  const handleSave = useCallback(() => {
    saveWorkflow(workflowId, nodes, edges, containers, viewport);
    setHasChanges(false);
  }, [workflowId, nodes, edges, containers, viewport, saveWorkflow]);

  const addNode = (type: EnhancedNodeType) => {
    const nodeType = NODE_TYPES.find((t) => t.type === type);
    const newNode: EnhancedWorkflowNode = {
      id: generateId("node"),
      type,
      position: {
        x: 250 - viewport.x + Math.random() * 100,
        y: 150 - viewport.y + Math.random() * 100,
      },
      data: {
        label: nodeType?.label || type,
      },
      handles:
        type === "trigger"
          ? [{ id: "out-1", type: "source", position: "bottom" }]
          : type === "end"
          ? [{ id: "in-1", type: "target", position: "top" }]
          : type === "condition"
          ? [
              { id: "in-1", type: "target", position: "top" },
              { id: "out-true", type: "source", position: "bottom", label: "Yes" },
              { id: "out-false", type: "source", position: "right", label: "No" },
            ]
          : [
              { id: "in-1", type: "target", position: "top" },
              { id: "out-1", type: "source", position: "bottom" },
            ],
    };
    setNodes((prev) => [...prev, newNode]);
    setHasChanges(true);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) =>
      prev.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
    );
    setSelectedNodeId(null);
    setShowNodeConfig(false);
    setHasChanges(true);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connecting) {
      // Complete connection
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (connecting.nodeId !== nodeId && targetNode) {
        const targetHandle = targetNode.handles.find((h) => h.type === "target");
        if (targetHandle) {
          const newEdge: EnhancedWorkflowEdge = {
            id: generateId("edge"),
            sourceNodeId: connecting.nodeId,
            sourceHandleId: connecting.handleId,
            targetNodeId: nodeId,
            targetHandleId: targetHandle.id,
          };
          setEdges((prev) => [...prev, newEdge]);
          setHasChanges(true);
        }
      }
      setConnecting(null);
    } else {
      setSelectedNodeId(nodeId);
      setDraggingNodeId(nodeId);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && canvasRef.current) {
      const deltaX = e.movementX / viewport.zoom;
      const deltaY = e.movementY / viewport.zoom;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? {
                ...node,
                position: {
                  x: node.position.x + deltaX,
                  y: node.position.y + deltaY,
                },
              }
            : node
        )
      );
      setHasChanges(true);
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
      setHasChanges(true);
    } else if (resizingContainer && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const currentY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      const deltaX = currentX - resizingContainer.startX;
      const deltaY = currentY - resizingContainer.startY;
      const minSize = 50;

      setContainers((prev) =>
        prev.map((c) => {
          if (c.id !== resizingContainer.containerId) return c;
          const newContainer = { ...c };

          switch (resizingContainer.handle) {
            case "e":
              newContainer.size = { ...c.size, width: Math.max(minSize, resizingContainer.startWidth + deltaX) };
              break;
            case "w":
              const newWidthW = Math.max(minSize, resizingContainer.startWidth - deltaX);
              newContainer.position = { ...c.position, x: resizingContainer.startPosX + (resizingContainer.startWidth - newWidthW) };
              newContainer.size = { ...c.size, width: newWidthW };
              break;
            case "s":
              newContainer.size = { ...c.size, height: Math.max(minSize, resizingContainer.startHeight + deltaY) };
              break;
            case "n":
              const newHeightN = Math.max(minSize, resizingContainer.startHeight - deltaY);
              newContainer.position = { ...c.position, y: resizingContainer.startPosY + (resizingContainer.startHeight - newHeightN) };
              newContainer.size = { ...c.size, height: newHeightN };
              break;
            case "se":
              newContainer.size = { width: Math.max(minSize, resizingContainer.startWidth + deltaX), height: Math.max(minSize, resizingContainer.startHeight + deltaY) };
              break;
            case "sw":
              const newWidthSW = Math.max(minSize, resizingContainer.startWidth - deltaX);
              newContainer.position = { ...c.position, x: resizingContainer.startPosX + (resizingContainer.startWidth - newWidthSW) };
              newContainer.size = { width: newWidthSW, height: Math.max(minSize, resizingContainer.startHeight + deltaY) };
              break;
            case "ne":
              const newHeightNE = Math.max(minSize, resizingContainer.startHeight - deltaY);
              newContainer.position = { ...c.position, y: resizingContainer.startPosY + (resizingContainer.startHeight - newHeightNE) };
              newContainer.size = { width: Math.max(minSize, resizingContainer.startWidth + deltaX), height: newHeightNE };
              break;
            case "nw":
              const newWidthNW = Math.max(minSize, resizingContainer.startWidth - deltaX);
              const newHeightNW = Math.max(minSize, resizingContainer.startHeight - deltaY);
              newContainer.position = {
                x: resizingContainer.startPosX + (resizingContainer.startWidth - newWidthNW),
                y: resizingContainer.startPosY + (resizingContainer.startHeight - newHeightNW),
              };
              newContainer.size = { width: newWidthNW, height: newHeightNW };
              break;
          }
          return newContainer;
        })
      );
      setHasChanges(true);
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
      const minSize = 50;
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width >= minSize && height >= minSize) {
        const newContainer: WorkflowContainer = {
          id: generateId("container"),
          name: "Group",
          color: "#7bed9f",
          position: {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
          },
          size: { width, height },
        };
        setContainers((prev) => [...prev, newContainer]);
        setSelectedContainerId(newContainer.id);
        setContainerName("Group");
        setContainerColor("#7bed9f");
        setShowContainerConfig(true);
        setHasChanges(true);
      }
      setDrawingContainer(null);
      setToolMode("select");
    }

    setDraggingNodeId(null);
    setDraggingContainerId(null);
    setResizingContainer(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0 && toolMode === "container") {
      // Start drawing container
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        setDrawingContainer({ startX: x, startY: y, currentX: x, currentY: y });
      }
    } else if (e.button === 0) {
      setSelectedNodeId(null);
      setSelectedContainerId(null);
      setConnecting(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewport.zoom * delta, 0.25), 2);
    setViewport((prev) => ({ ...prev, zoom: newZoom }));
  };

  const handleNodeDoubleClick = (node: EnhancedWorkflowNode) => {
    setSelectedNodeId(node.id);
    setNodeLabel(node.data.label);
    setNodeDescription(node.data.description || "");
    setShowNodeConfig(true);
  };

  const handleSaveNodeConfig = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: { ...node.data, label: nodeLabel, description: nodeDescription },
            }
          : node
      )
    );
    setShowNodeConfig(false);
    setHasChanges(true);
  };

  const startConnecting = (nodeId: string, handleId: string) => {
    setConnecting({ nodeId, handleId });
    setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    setHasChanges(true);
  };

  const getNodeColor = (type: EnhancedNodeType) => {
    return NODE_TYPES.find((t) => t.type === type)?.color || "#8a8a8a";
  };

  // Container handlers
  const handleContainerMouseDown = (e: React.MouseEvent, containerId: string) => {
    e.stopPropagation();
    setSelectedContainerId(containerId);
    setSelectedNodeId(null);
    setDraggingContainerId(containerId);
  };

  const handleContainerDoubleClick = (container: WorkflowContainer) => {
    setSelectedContainerId(container.id);
    setContainerName(container.name);
    setContainerColor(container.color);
    setShowContainerConfig(true);
  };

  const startResize = (e: React.MouseEvent, containerId: string, handle: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw") => {
    e.stopPropagation();
    const container = containers.find((c) => c.id === containerId);
    if (!container || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const startY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

    setResizingContainer({
      containerId,
      handle,
      startX,
      startY,
      startWidth: container.size.width,
      startHeight: container.size.height,
      startPosX: container.position.x,
      startPosY: container.position.y,
    });
  };

  const handleSaveContainerConfig = () => {
    if (!selectedContainerId) return;
    setContainers((prev) =>
      prev.map((c) =>
        c.id === selectedContainerId
          ? { ...c, name: containerName, color: containerColor }
          : c
      )
    );
    setShowContainerConfig(false);
    setHasChanges(true);
  };

  const deleteContainer = (containerId: string) => {
    setContainers((prev) => prev.filter((c) => c.id !== containerId));
    setSelectedContainerId(null);
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Delete") {
      if (selectedNodeId) {
        deleteNode(selectedNodeId);
      } else if (selectedContainerId) {
        deleteContainer(selectedContainerId);
      }
    }
    if (e.key === "Escape") {
      setConnecting(null);
      setSelectedNodeId(null);
      setSelectedContainerId(null);
      setToolMode("select");
      setDrawingContainer(null);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  if (!workflow) {
    return (
      <div className={styles.loading}>
        <p>Loading workflow...</p>
      </div>
    );
  }

  return (
    <div className={styles.container} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={`/dashboard/team-workflows/${projectId}`}
            className={styles.backLink}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1>{workflow.name}</h1>
            <div className={styles.workflowMeta}>
              <span className={`${styles.statusBadge} ${styles[workflow.status]}`}>
                {workflow.status}
              </span>
              <span className={styles.nodeCount}>{nodes.length} nodes</span>
              {hasChanges && <span className={styles.unsaved}>Unsaved changes</span>}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.presenceRow}>
            {phantomPresences.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className={styles.presenceAvatar}
                style={{ backgroundColor: p.color }}
                title={`${p.userName} is editing`}
              >
                {p.userName.charAt(0)}
              </div>
            ))}
          </div>
          {connecting && (
            <span className={styles.connectingHint}>
              Click a node to connect, or press Esc
            </span>
          )}
          <div className={styles.zoomControls}>
            <button onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.2, 2) }))}>
              +
            </button>
            <span>{Math.round(viewport.zoom * 100)}%</span>
            <button onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom / 1.2, 0.25) }))}>
              -
            </button>
          </div>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Node Palette */}
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

          <h3>Nodes</h3>
          <div className={styles.nodeTypes}>
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.type}
                className={styles.nodeTypeBtn}
                onClick={() => addNode(nodeType.type)}
              >
                <span
                  className={styles.nodeTypeDot}
                  style={{ backgroundColor: nodeType.color }}
                />
                {nodeType.label}
              </button>
            ))}
          </div>
          <div className={styles.paletteHelp}>
            <p>Click to add node</p>
            <p>Double-click to edit</p>
            <p>Click + to connect</p>
            <p>Shift+drag to pan</p>
            <p>Scroll to zoom</p>
            <p>Container: Draw to group</p>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`${styles.canvas} ${connecting ? styles.connecting : ""} ${
            isPanning ? styles.panning : ""
          } ${toolMode === "container" ? styles.drawingMode : ""}`}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          <div
            className={styles.canvasContent}
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            }}
          >
            {/* Grid */}
            <div className={styles.grid} />

            {/* Containers (render before nodes for z-index) */}
            {containers.map((container) => (
              <div
                key={container.id}
                className={`${styles.containerBox} ${
                  selectedContainerId === container.id ? styles.selectedContainer : ""
                }`}
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

                {/* Resize handles (only when selected) */}
                {selectedContainerId === container.id && (
                  <>
                    <div className={`${styles.resizeHandle} ${styles.resizeN}`} onMouseDown={(e) => startResize(e, container.id, "n")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeS}`} onMouseDown={(e) => startResize(e, container.id, "s")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeE}`} onMouseDown={(e) => startResize(e, container.id, "e")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeW}`} onMouseDown={(e) => startResize(e, container.id, "w")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNE}`} onMouseDown={(e) => startResize(e, container.id, "ne")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNW}`} onMouseDown={(e) => startResize(e, container.id, "nw")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSE}`} onMouseDown={(e) => startResize(e, container.id, "se")} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSW}`} onMouseDown={(e) => startResize(e, container.id, "sw")} />

                    {/* Delete button */}
                    <button
                      className={styles.deleteContainerBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContainer(container.id);
                      }}
                      title="Delete container"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Drawing Preview */}
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

            {/* Edges */}
            <svg className={styles.edgesSvg}>
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
                const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
                if (!sourceNode || !targetNode) return null;

                const sourceHandle = sourceNode.handles.find(
                  (h) => h.id === edge.sourceHandleId
                );
                const targetHandle = targetNode.handles.find(
                  (h) => h.id === edge.targetHandleId
                );

                const getHandleOffset = (position: string) => {
                  switch (position) {
                    case "top":
                      return { x: 70, y: 0 };
                    case "bottom":
                      return { x: 70, y: 60 };
                    case "left":
                      return { x: 0, y: 30 };
                    case "right":
                      return { x: 140, y: 30 };
                    default:
                      return { x: 70, y: 30 };
                  }
                };

                const sourceOffset = getHandleOffset(sourceHandle?.position || "bottom");
                const targetOffset = getHandleOffset(targetHandle?.position || "top");

                const x1 = sourceNode.position.x + sourceOffset.x;
                const y1 = sourceNode.position.y + sourceOffset.y;
                const x2 = targetNode.position.x + targetOffset.x;
                const y2 = targetNode.position.y + targetOffset.y;

                const midY = (y1 + y2) / 2;
                const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                return (
                  <g key={edge.id}>
                    <path
                      d={d}
                      className={styles.edge}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this connection?")) {
                          deleteEdge(edge.id);
                        }
                      }}
                    />
                    <circle cx={x2} cy={y2} r="4" fill="var(--accent)" />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`${styles.node} ${
                  selectedNodeId === node.id ? styles.selected : ""
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  borderColor: getNodeColor(node.type),
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={() => handleNodeDoubleClick(node)}
              >
                <div
                  className={styles.nodeHeader}
                  style={{ backgroundColor: getNodeColor(node.type) }}
                >
                  {node.type}
                </div>
                <div className={styles.nodeBody}>
                  <span className={styles.nodeLabel}>{node.data.label}</span>
                  {node.data.description && (
                    <span className={styles.nodeDesc}>{node.data.description}</span>
                  )}
                </div>

                {/* Handles */}
                {node.handles
                  .filter((h) => h.type === "source")
                  .map((handle) => (
                    <button
                      key={handle.id}
                      className={`${styles.handle} ${styles.handleSource} ${
                        styles[`handle${handle.position.charAt(0).toUpperCase()}${handle.position.slice(1)}`]
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        startConnecting(node.id, handle.id);
                      }}
                      title={handle.label || "Connect"}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  ))}

                {node.handles
                  .filter((h) => h.type === "target")
                  .map((handle) => (
                    <div
                      key={handle.id}
                      className={`${styles.handle} ${styles.handleTarget} ${
                        styles[`handle${handle.position.charAt(0).toUpperCase()}${handle.position.slice(1)}`]
                      }`}
                    />
                  ))}

                {selectedNodeId === node.id && (
                  <button
                    className={styles.deleteNodeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    title="Delete node"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {nodes.length === 0 && (
              <div className={styles.canvasEmpty}>
                <p>Add nodes from the palette to start building</p>
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
              <h2>Configure Node</h2>
              <div className={styles.formGroup}>
                <label>Label</label>
                <input
                  type="text"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={nodeDescription}
                  onChange={(e) => setNodeDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowNodeConfig(false)}
                >
                  Cancel
                </button>
                <button className={styles.submitBtn} onClick={handleSaveNodeConfig}>
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Container Config Modal */}
      <AnimatePresence>
        {showContainerConfig && selectedContainerId && (
          <div className={styles.modalOverlay} onClick={() => setShowContainerConfig(false)}>
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Configure Container</h2>
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
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowContainerConfig(false)}
                >
                  Cancel
                </button>
                <button className={styles.submitBtn} onClick={handleSaveContainerConfig}>
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
