"use client";

// This hook will be enabled after running `npx convex dev`
// For now, use useCanvasData which works with localStorage

import { useCallback, useRef } from "react";

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

interface UseCanvasSyncOptions {
  projectId: string;
}

// Placeholder hook - will be replaced with Convex implementation
export function useCanvasSync({ projectId }: UseCanvasSyncOptions) {
  console.warn(
    "useCanvasSync: Convex not configured. Run `npx convex dev` to enable real-time sync."
  );

  return {
    nodes: [] as CanvasNode[],
    containers: [] as CanvasContainer[],
    viewport: { x: 0, y: 0, zoom: 1 },
    version: 0,
    isLoading: false,

    // Node actions (no-op for now)
    addNode: async (_node: CanvasNode) => {},
    updateNodePosition: async (_nodeId: string, _position: { x: number; y: number }) => {},
    updateNodeSize: async (_nodeId: string, _size: { width: number; height: number }) => {},
    updateNodeContent: async (
      _nodeId: string,
      _updates: { content?: string; assignee?: string; color?: string }
    ) => {},
    deleteNode: async (_nodeId: string) => {},
    batchUpdateNodes: async (_nodes: CanvasNode[]) => {},

    // Container actions (no-op for now)
    addContainer: async (_container: CanvasContainer) => {},
    updateContainerPosition: async (_containerId: string, _position: { x: number; y: number }) => {},
    updateContainerSize: async (_containerId: string, _size: { width: number; height: number }) => {},
    updateContainerProps: async (
      _containerId: string,
      _updates: { name?: string; color?: string }
    ) => {},
    deleteContainer: async (_containerId: string) => {},

    // Viewport
    updateViewport: (_viewport: { x: number; y: number; zoom: number }) => {},
  };
}
