"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCollaboration } from "@/context/CollaborationContext";
import { WorkflowNode, WorkflowEdge } from "@/types/collaboration";
import { generateId } from "@/services/dataService";
import styles from "./editor.module.css";

const NODE_TYPES = [
  { type: "start", label: "Start", color: "var(--status-completed)" },
  { type: "action", label: "Action", color: "var(--accent)" },
  { type: "condition", label: "Condition", color: "var(--priority-high)" },
  { type: "delay", label: "Delay", color: "var(--text-muted)" },
  { type: "integration", label: "Integration", color: "var(--priority-medium)" },
  { type: "end", label: "End", color: "var(--priority-critical)" },
] as const;

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    workflows,
    loadWorkflows,
    updateWorkflow,
    saveWorkflowNodes,
  } = useCollaboration();

  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);

  // Node config state
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeDescription, setNodeDescription] = useState("");

  const workflow = workflows.find((w) => w.id === workflowId);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    if (workflow) {
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
    }
  }, [workflow]);

  const handleSave = useCallback(() => {
    saveWorkflowNodes(workflowId, nodes, edges);
  }, [workflowId, nodes, edges, saveWorkflowNodes]);

  const addNode = (type: WorkflowNode["type"]) => {
    const newNode: WorkflowNode = {
      id: generateId("node"),
      type,
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        label: NODE_TYPES.find((t) => t.type === type)?.label || type,
      },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId));
    setSelectedNodeId(null);
    setShowNodeConfig(false);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connecting) {
      // Create edge
      if (connecting !== nodeId) {
        const newEdge: WorkflowEdge = {
          id: generateId("edge"),
          sourceId: connecting,
          targetId: nodeId,
        };
        setEdges((prev) => [...prev, newEdge]);
      }
      setConnecting(null);
    } else {
      setSelectedNodeId(nodeId);
      setDraggingNodeId(nodeId);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 60;
      const y = e.clientY - rect.top - 20;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? { ...node, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : node
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleNodeDoubleClick = (node: WorkflowNode) => {
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
          ? { ...node, data: { ...node.data, label: nodeLabel, description: nodeDescription } }
          : node
      )
    );
    setShowNodeConfig(false);
  };

  const startConnecting = (nodeId: string) => {
    setConnecting(nodeId);
    setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const getNodeColor = (type: WorkflowNode["type"]) => {
    return NODE_TYPES.find((t) => t.type === type)?.color || "var(--text-muted)";
  };

  if (!workflow) {
    return (
      <div className={styles.loading}>
        <p>Loading workflow...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard/workflows/builder" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1>{workflow.name}</h1>
            <span className={styles.statusBadge}>{workflow.status}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {connecting && (
            <span className={styles.connectingHint}>
              Click a node to connect, or press Esc to cancel
            </span>
          )}
          <button className={styles.saveBtn} onClick={handleSave}>
            Save Workflow
          </button>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Palette */}
        <div className={styles.palette}>
          <h3>Nodes</h3>
          <div className={styles.nodeTypes}>
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.type}
                className={styles.nodeTypeBtn}
                onClick={() => addNode(nodeType.type)}
                style={{ borderColor: nodeType.color }}
              >
                <span className={styles.nodeTypeDot} style={{ backgroundColor: nodeType.color }} />
                {nodeType.label}
              </button>
            ))}
          </div>
          <div className={styles.paletteInfo}>
            <p>Drag nodes on canvas</p>
            <p>Double-click to edit</p>
            <p>Click connector to link</p>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`${styles.canvas} ${connecting ? styles.connecting : ""}`}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={() => {
            setSelectedNodeId(null);
            setConnecting(null);
          }}
          onKeyDown={(e) => e.key === "Escape" && setConnecting(null)}
          tabIndex={0}
        >
          {/* Edges */}
          <svg className={styles.edgesSvg}>
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.sourceId);
              const targetNode = nodes.find((n) => n.id === edge.targetId);
              if (!sourceNode || !targetNode) return null;

              const x1 = sourceNode.position.x + 60;
              const y1 = sourceNode.position.y + 20;
              const x2 = targetNode.position.x + 60;
              const y2 = targetNode.position.y + 20;

              const midX = (x1 + x2) / 2;
              const d = `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${(y1 + y2) / 2} Q ${midX} ${y2} ${x2} ${y2}`;

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
              className={`${styles.node} ${selectedNodeId === node.id ? styles.selected : ""}`}
              style={{
                left: node.position.x,
                top: node.position.y,
                borderColor: getNodeColor(node.type),
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
            >
              <span className={styles.nodeType} style={{ backgroundColor: getNodeColor(node.type) }}>
                {node.type}
              </span>
              <span className={styles.nodeLabel}>{node.data.label}</span>
              <button
                className={styles.connectBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  startConnecting(node.id);
                }}
                title="Connect to another node"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              {selectedNodeId === node.id && (
                <button
                  className={styles.deleteNodeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
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

      {/* Node Config Modal */}
      {showNodeConfig && (
        <div className={styles.modalOverlay} onClick={() => setShowNodeConfig(false)}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
              <button className={styles.cancelBtn} onClick={() => setShowNodeConfig(false)}>
                Cancel
              </button>
              <button className={styles.submitBtn} onClick={handleSaveNodeConfig}>
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
