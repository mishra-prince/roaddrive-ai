import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Admin access control — mock auth for the prototype.
 * Replace `signIn` with a real backend call later; the shape stays the same.
 *
 * The demo credential is intentionally visible in the UI (SIH demo),
 * but the gate itself is real: /admin/* is unreachable without a session.
 */

export interface AdminSession {
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

/** Frontend-only demo credential. A real backend must validate this. */
const DEMO_EMAIL = 'admin@roaddrive.gov.in';
const DEMO_PASS = 'road2026';

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
    if (email.trim().toLowerCase() === DEMO_EMAIL && pass === DEMO_PASS) {
      const s: AdminSession = {
        name: 'Road Authority',
        department: 'Gurugram Metropolitan Development Authority',
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
