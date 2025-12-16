"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";

interface ConvexUserData {
  convexUserId: Id<"users"> | null;
  workspaceId: Id<"workspaces"> | null;
  projectId: Id<"projects"> | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

const CONVEX_USER_DATA_KEY = "bt_convex_user_data";

// Persist Convex IDs to localStorage to maintain association
function getStoredConvexData(email: string): {
  convexUserId?: string;
  workspaceId?: string;
  projectId?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${CONVEX_USER_DATA_KEY}_${email}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeConvexData(
  email: string,
  data: { convexUserId: string; workspaceId: string; projectId: string }
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${CONVEX_USER_DATA_KEY}_${email}`, JSON.stringify(data));
}

export function useConvexUser(): ConvexUserData {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [workspaceId, setWorkspaceId] = useState<Id<"workspaces"> | null>(null);
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const createUser = useMutation(api.auth.users.createUser);
  const createWorkspace = useMutation(api.workspaces.mutations.create);
  const createProject = useMutation(api.projects.mutations.create);

  // Convex queries
  const existingUser = useQuery(
    api.auth.users.getUserByEmail,
    user?.email && !isGuest ? { email: user.email } : "skip"
  );
  const userWorkspaces = useQuery(
    api.workspaces.queries.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  const workspaceProjects = useQuery(
    api.projects.queries.listByWorkspace,
    workspaceId ? { workspaceId } : "skip"
  );

  // Initialize or sync user with Convex
  useEffect(() => {
    if (!user || isGuest) {
      setConvexUserId(null);
      setWorkspaceId(null);
      setProjectId(null);
      setIsLoading(false);
      return;
    }

    const initUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check for stored Convex data first
        const stored = getStoredConvexData(user.email);

        // Check if user exists in Convex
        if (existingUser !== undefined) {
          if (existingUser) {
            // User exists in Convex
            setConvexUserId(existingUser._id);
          } else {
            // Create new user in Convex
            const newUserId = await createUser({
              email: user.email,
              name: user.name,
            });
            setConvexUserId(newUserId);
          }
        }
      } catch (err) {
        console.error("Failed to initialize Convex user:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize user");
      }
    };

    initUser();
  }, [user, isGuest, existingUser, createUser]);

  // Create or get workspace for user
  useEffect(() => {
    if (!convexUserId || !user) return;

    const initWorkspace = async () => {
      try {
        if (userWorkspaces !== undefined && userWorkspaces !== null) {
          if (userWorkspaces.length > 0) {
            // Use existing workspace
            const firstWorkspace = userWorkspaces[0];
            if (firstWorkspace && firstWorkspace._id) {
              setWorkspaceId(firstWorkspace._id);
            }
          } else {
            // Create default workspace
            const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
            const newWorkspaceId = await createWorkspace({
              name: `${user.name}'s Workspace`,
              slug: `${slug}-${Date.now()}`,
              description: "Default workspace",
              userId: convexUserId,
            });
            setWorkspaceId(newWorkspaceId);
          }
        }
      } catch (err) {
        console.error("Failed to initialize workspace:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize workspace");
      }
    };

    initWorkspace();
  }, [convexUserId, userWorkspaces, user, createWorkspace]);

  // Create or get project for workspace
  useEffect(() => {
    if (!convexUserId || !workspaceId) return;

    const initProject = async () => {
      try {
        if (workspaceProjects !== undefined && workspaceProjects !== null) {
          if (workspaceProjects.length > 0) {
            // Use existing project
            const firstProject = workspaceProjects[0];
            if (firstProject && firstProject._id) {
              setProjectId(firstProject._id);

              // Store the association for persistence
              if (user) {
                storeConvexData(user.email, {
                  convexUserId: convexUserId as string,
                  workspaceId: workspaceId as string,
                  projectId: firstProject._id as string,
                });
              }
            }
          } else {
            // Create default project
            const newProjectId = await createProject({
              workspaceId,
              name: "Default Project",
              description: "Your default project canvas",
              key: `PRJ${Date.now()}`,
              userId: convexUserId,
            });
            setProjectId(newProjectId);
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize project:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize project");
        setIsLoading(false);
      }
    };

    initProject();
  }, [convexUserId, workspaceId, workspaceProjects, user, createProject]);

  return {
    convexUserId,
    workspaceId,
    projectId,
    isLoading,
    isReady: !!convexUserId && !!workspaceId && !!projectId && !isLoading,
    error,
  };
}
