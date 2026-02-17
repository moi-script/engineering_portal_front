import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface UserData {
  name: string;
  token: string;
  adminToken?: string;
}

interface AdminData {
  name: string;
  token: string;
}

interface UserContextType {
  user: UserData | null;
  admin: AdminData | null;
  loginUser: (data: UserData) => void;
  loginAdmin: (data: AdminData) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Safe parse helper ────────────────────────────────────────────────────────
// Handles both plain strings and JSON-stringified objects in sessionStorage
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const savedUser  = safeParse<UserData>(sessionStorage.getItem("userData"));
      const savedAdmin = safeParse<AdminData>(sessionStorage.getItem("adminData"));

      // ── FIX: strip any accidental surrounding quotes from token ──────────
      if (savedUser) {
        savedUser.token = savedUser.token.replace(/^"|"$/g, "").trim();
        if (savedUser.adminToken) {
          savedUser.adminToken = savedUser.adminToken.replace(/^"|"$/g, "").trim();
        }
        setUser(savedUser);
      }
      if (savedAdmin) {
        savedAdmin.token = savedAdmin.token.replace(/^"|"$/g, "").trim();
        setAdmin(savedAdmin);
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUser = (data: UserData) => {
    // ── FIX: strip quotes before storing so they never accumulate ──────────
    const clean: UserData = {
      ...data,
      token: data.token.replace(/^"|"$/g, "").trim(),
      adminToken: data.adminToken?.replace(/^"|"$/g, "").trim(),
    };
    setUser(clean);
    // Store under a distinct key ("userData") to avoid conflicts with old keys
    sessionStorage.setItem("userData", JSON.stringify(clean));
  };

  const loginAdmin = (data: AdminData) => {
    const clean: AdminData = {
      ...data,
      token: data.token.replace(/^"|"$/g, "").trim(),
    };
    setAdmin(clean);
    sessionStorage.setItem("adminData", JSON.stringify(clean));
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    sessionStorage.clear();
  };

  return (
    <UserContext.Provider value={{ user, admin, loginUser, loginAdmin, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};