import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Admin access control — mock auth for the prototype.
 * Replace `signIn` with a real backend call later; the shape stays the same.
 *
 * Access is granted by adding an entry to ADMIN_ACCOUNTS below (or, post-
 * backend, by creating the account server-side). Each authority member gets
 * their own email + password and is identified by name/department in the UI.
 */

export interface AdminSession {
  email: string;
  name: string;
  department: string;
  expiresAt: number;
}

interface AuthCtx {
  session: AdminSession | null;
  signIn: (email: string, pass: string) => { ok: boolean; error?: string };
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = 'roaddrive.admin.session';
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Authorized authority accounts (frontend-only demo tier).
 * To grant access: add a row here and redeploy — or share the person's row
 * with them directly. To revoke: delete the row.
 */
export const ADMIN_ACCOUNTS: Array<{
  email: string;
  password: string;
  name: string;
  department: string;
}> = [
  {
    email: 'admin@roaddrive.gov.in',
    password: 'road2026',
    name: 'Road Authority',
    department: 'Gurugram Metropolitan Development Authority',
  },
  {
    email: 'ravi.gmda@roaddrive.gov.in',
    password: 'gmda-2026',
    name: 'Ravi Sharma',
    department: 'Road Maintenance Division',
  },
  {
    email: 'priya.gmda@roaddrive.gov.in',
    password: 'verify-2026',
    name: 'Priya Nair',
    department: 'Verification Cell',
  },
];

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AdminSession;
      return s.expiresAt > Date.now() ? s : null;
    } catch {
      return null;
    }
  });

  const signIn = useCallback((email: string, pass: string) => {
    const account = ADMIN_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === pass,
    );
    if (account) {
      const s: AdminSession = {
        email: account.email,
        name: account.name,
        department: account.department,
        expiresAt: Date.now() + SESSION_MS,
      };
      localStorage.setItem(KEY, JSON.stringify(s));
      setSession(s);
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials. Access is restricted to authorized authority personnel.' };
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
