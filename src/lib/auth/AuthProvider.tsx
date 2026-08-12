import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase/client";

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  station_scope_all?: boolean;
  station_id?: string | null;
  role_id?: string;
  status?: string;
}

interface AuthContextType {
  staff: StaffUser | null;
  can: (module: string, action: "create" | "read" | "update" | "delete") => boolean;
  logout: () => void;
  setStaff: (staff: StaffUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem("wassup_current_staff");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: "admin-001",
      name: "Trần Minh Quân (Admin)",
      username: "admin",
      station_scope_all: true,
      role_id: "master_admin",
    };
  });

  useEffect(() => {
    if (staff) {
      localStorage.setItem("wassup_current_staff", JSON.stringify(staff));
    } else {
      localStorage.removeItem("wassup_current_staff");
    }
  }, [staff]);

  const can = (_module: string, _action: "create" | "read" | "update" | "delete"): boolean => {
    if (!staff) return false;
    if (staff.station_scope_all) return true;
    return true; // Default allow for admin/manager or customizable
  };

  const logout = () => {
    setStaff(null);
  };

  return (
    <AuthContext.Provider value={{ staff, can, logout, setStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      staff: {
        id: "admin-001",
        name: "Trần Minh Quân (Admin)",
        username: "admin",
        station_scope_all: true,
        role_id: "master_admin",
      },
      can: (_module: string, _action: string) => true,
      logout: () => {},
      setStaff: () => {},
    };
  }
  return context;
}
