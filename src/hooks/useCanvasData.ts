"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";

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

const DEFAULT_ROOM = "team-canvas";

export function useCanvasData(roomId?: string) {
  const { user } = useAuth();
  const room = roomId || DEFAULT_ROOM;

  // Track if we're currently dragging (for optimistic updates)
  const [isDragging, setIsDragging] = useState(false);
  const [localNodes, setLocalNodes] = useState<CanvasNode[]>([]);
  const [localContainers, setLocalContainers] = useState<CanvasContainer[]>([]);
  const [localViewport, setLocalViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // Convex real-time query - this auto-updates when data changes
  const sharedCanvas = useQuery(api.sharedCanvas.get, { roomId: room });

  // Convex mutations
  const initCanvas = useMutation(api.sharedCanvas.init);
  const addNodeMutation = useMutation(api.sharedCanvas.addNode);
  const updateNodeMutation = useMutation(api.sharedCanvas.updateNode);
  const deleteNodeMutation = useMutation(api.sharedCanvas.deleteNode);
  const addContainerMutation = useMutation(api.sharedCanvas.addContainer);
  const updateContainerMutation = useMutation(api.sharedCanvas.updateContainer);
  const deleteContainerMutation = useMutation(api.sharedCanvas.deleteContainer);
  const batchUpdateNodesMutation = useMutation(api.sharedCanvas.batchUpdateNodes);
  const batchUpdateContainersMutation = useMutation(api.sharedCanvas.batchUpdateContainers);

  // Sync Convex data to local state (when not dragging)
  useEffect(() => {
    if (sharedCanvas && !isDragging) {
      setLocalNodes(sharedCanvas.nodes || []);
      setLocalContainers(sharedCanvas.containers || []);
      setLocalViewport(sharedCanvas.viewport || { x: 0, y: 0, zoom: 1 });
    }
  }, [sharedCanvas, isDragging]);

  // Initialize canvas on first load
  useEffect(() => {
    if (sharedCanvas && sharedCanvas._id === null) {
      initCanvas({ roomId: room });
    }
  }, [sharedCanvas, initCanvas, room]);

  // User name for tracking edits
  const userName = user?.name || user?.email || "Anonymous";

  // ============ NODE OPERATIONS ============

  const addNode = useCallback(async (node: CanvasNode) => {
    // Optimistic update
    setLocalNodes(prev => [...prev, node]);
    // Persist to Convex
    await addNodeMutation({ roomId: room, node, editedBy: userName });
  }, [addNodeMutation, room, userName]);

  const updateNode = useCallback(async (
    nodeId: string,
    updates: Partial<Pick<CanvasNode, "position" | "size" | "content" | "color" | "assignee">>
  ) => {
    // Optimistic update
    setLocalNodes(prev =>
      prev.map(n => n.id === nodeId ? { ...n, ...updates } : n)
    );
    // Persist to Convex
    await updateNodeMutation({ roomId: room, nodeId, updates, editedBy: userName });
  }, [updateNodeMutation, room, userName]);

  const deleteNode = useCallback(async (nodeId: string) => {
    // Optimistic update
    setLocalNodes(prev => prev.filter(n => n.id !== nodeId));
    // Persist to Convex
    await deleteNodeMutation({ roomId: room, nodeId, editedBy: userName });
  }, [deleteNodeMutation, room, userName]);

  // ============ CONTAINER OPERATIONS ============

  const addContainer = useCallback(async (container: CanvasContainer) => {
    // Optimistic update
    setLocalContainers(prev => [...prev, container]);
    // Persist to Convex
    await addContainerMutation({ roomId: room, container, editedBy: userName });
  }, [addContainerMutation, room, userName]);

  const updateContainer = useCallback(async (
    containerId: string,
    updates: Partial<Pick<CanvasContainer, "name" | "color" | "position" | "size">>
  ) => {
    // Optimistic update
    setLocalContainers(prev =>
      prev.map(c => c.id === containerId ? { ...c, ...updates } : c)
    );
    // Persist to Convex
    await updateContainerMutation({ roomId: room, containerId, updates, editedBy: userName });
  }, [updateContainerMutation, room, userName]);

  const deleteContainer = useCallback(async (containerId: string) => {
    // Optimistic update
    setLocalContainers(prev => prev.filter(c => c.id !== containerId));
    // Persist to Convex
    await deleteContainerMutation({ roomId: room, containerId, editedBy: userName });
  }, [deleteContainerMutation, room, userName]);

  // ============ BATCH OPERATIONS (for drag end) ============

  const batchUpdateNodes = useCallback(async (nodes: CanvasNode[]) => {
    setLocalNodes(nodes);
    await batchUpdateNodesMutation({ roomId: room, nodes, editedBy: userName });
  }, [batchUpdateNodesMutation, room, userName]);

  const batchUpdateContainers = useCallback(async (containers: CanvasContainer[]) => {
    setLocalContainers(containers);
    await batchUpdateContainersMutation({ roomId: room, containers, editedBy: userName });
  }, [batchUpdateContainersMutation, room, userName]);

  // ============ VIEWPORT (local only - not synced) ============

  const updateViewport = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    setLocalViewport(viewport);
  }, []);

  // ============ DRAG STATE MANAGEMENT ============

  const startDragging = useCallback(() => {
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Direct setters for smooth dragging (updates local state only)
  const setNodes = useCallback((updater: CanvasNode[] | ((prev: CanvasNode[]) => CanvasNode[])) => {
    if (typeof updater === "function") {
      setLocalNodes(updater);
    } else {
      setLocalNodes(updater);
    }
  }, []);

  const setContainers = useCallback((updater: CanvasContainer[] | ((prev: CanvasContainer[]) => CanvasContainer[])) => {
    if (typeof updater === "function") {
      setLocalContainers(updater);
    } else {
      setLocalContainers(updater);
    }
  }, []);

  const setViewport = useCallback((updater: typeof localViewport | ((prev: typeof localViewport) => typeof localViewport)) => {
    if (typeof updater === "function") {
      setLocalViewport(updater);
    } else {
      setLocalViewport(updater);
    }
  }, []);

  // Sync nodes to Convex after drag ends
  const syncToConvex = useCallback(async () => {
    await batchUpdateNodesMutation({ roomId: room, nodes: localNodes, editedBy: userName });
    await batchUpdateContainersMutation({ roomId: room, containers: localContainers, editedBy: userName });
    setIsDragging(false);
  }, [batchUpdateNodesMutation, batchUpdateContainersMutation, room, localNodes, localContainers, userName]);

  return {
    // State
    nodes: localNodes,
    containers: localContainers,
    viewport: localViewport,
    isLoading: sharedCanvas === undefined,
    isConnected: sharedCanvas !== undefined,
    version: sharedCanvas?.version || 0,
    lastEditedBy: sharedCanvas?.lastEditedBy,
    roomId: room,

    // Direct setters (for smooth UI updates during drag)
    setNodes,
    setContainers,
    setViewport,

    // Drag state management
    startDragging,
    stopDragging,
    isDragging,

    // Operations (with Convex persistence)
    addNode,
    updateNode,
    deleteNode,
    addContainer,
    updateContainer,
    deleteContainer,
    batchUpdateNodes,
    batchUpdateContainers,
    updateViewport,
    syncToConvex,
  };
}
