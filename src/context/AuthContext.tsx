import React, { createContext, useContext, useState } from 'react';
import type { CurrentUser, UserRole } from '../types';

const MOCK_USERS: Record<UserRole, CurrentUser> = {
  csm: { id: 'csm-001', name: 'Sarah Chen', role: 'csm', csm_owner_id: 'csm-001' },
  cs_leadership: { id: 'lead-001', name: 'Alex Thompson', role: 'cs_leadership', csm_owner_id: 'lead-001' },
  operations: { id: 'ops-001', name: 'Jordan Lee', role: 'operations', csm_owner_id: 'ops-001' },
};

interface AuthContextType {
  user: CurrentUser;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(MOCK_USERS.cs_leadership);
  const switchRole = (role: UserRole) => setUser(MOCK_USERS[role]);
  return <AuthContext.Provider value={{ user, switchRole }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
