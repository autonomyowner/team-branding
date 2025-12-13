"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  avatar?: string;
  createdAt: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  continueAsGuest: () => void;
  updateUser: (data: Partial<User>) => void;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  company: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database (in real app, this would be API calls)
const USERS_STORAGE_KEY = "nexus_users";
const CURRENT_USER_KEY = "nexus_current_user";

// Guest user template
const GUEST_USER: User = {
  id: "guest-user",
  email: "guest@nexus.app",
  name: "Guest User",
  company: "Nexus",
  role: "Guest",
  createdAt: new Date().toISOString(),
  isGuest: true,
};

function getStoredUsers(): Record<string, { user: User; password: string }> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveUsers(users: Record<string, { user: User; password: string }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount, default to guest
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      // Default to guest mode
      setUser(GUEST_USER);
      setCurrentUser(GUEST_USER);
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = getStoredUsers();
    const userRecord = users[email.toLowerCase()];

    if (!userRecord) {
      setIsLoading(false);
      return { success: false, error: "No account found with this email" };
    }

    if (userRecord.password !== password) {
      setIsLoading(false);
      return { success: false, error: "Incorrect password" };
    }

    setUser(userRecord.user);
    setCurrentUser(userRecord.user);
    setIsLoading(false);

    return { success: true };
  };

  const signup = async (
    data: SignupData
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = getStoredUsers();
    const emailKey = data.email.toLowerCase();

    if (users[emailKey]) {
      setIsLoading(false);
      return { success: false, error: "An account with this email already exists" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      company: data.company,
      role: "Admin",
      createdAt: new Date().toISOString(),
      isGuest: false,
    };

    users[emailKey] = { user: newUser, password: data.password };
    saveUsers(users);

    setUser(newUser);
    setCurrentUser(newUser);
    setIsLoading(false);

    return { success: true };
  };

  const logout = () => {
    // Return to guest mode instead of null
    setUser(GUEST_USER);
    setCurrentUser(GUEST_USER);
    router.push("/dashboard");
  };

  const continueAsGuest = () => {
    setUser(GUEST_USER);
    setCurrentUser(GUEST_USER);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user || user.isGuest) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    setCurrentUser(updatedUser);

    // Update in storage
    const users = getStoredUsers();
    const emailKey = user.email.toLowerCase();
    if (users[emailKey]) {
      users[emailKey].user = updatedUser;
      saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !user.isGuest,
        isGuest: !!user?.isGuest,
        login,
        signup,
        logout,
        continueAsGuest,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
