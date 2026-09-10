import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Radio, Lock, Building2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../auth/AdminAuth';
import { DemoBadge } from '../../components/common';

/**
 * Authority sign-in — the only door into /admin/*.
 * Users of the driver app never see this surface or any admin data.
 */
export default function AdminLogin() {
  const { session, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={from} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    // simulate a network round-trip for realism
    setTimeout(() => {
      const res = signIn(email, pass);
      setBusy(false);
      if (res.ok) navigate(from, { replace: true });
      else setError(res.error ?? 'Sign-in failed');
    }, 450);
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      {/* brand panel */}
      <div className="hidden flex-col justify-between bg-primary-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600" aria-hidden>
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">RoadDrive Authority</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted">Command Center</div>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-2xl font-bold leading-snug">
            Spatial road intelligence for verified authorities only.
          </h1>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>• Live 3D hazard intelligence map</li>
            <li>• Verification & repair workflows</li>
            <li>• Anonymous crowdsourced evidence</li>
          </ul>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Sessions expire after 8 hours. Access is logged.
        </p>
      </div>

      {/* form panel */}
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 text-white" aria-hidden>
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-base font-bold text-ink">RoadDrive Authority</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-ink">Sign in to the authority console</h2>
          <p className="mt-1 text-sm text-muted">
            Access is restricted. Credentials are issued by the road authority.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label-xs mb-1.5 block">Official email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="name@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="pass" className="label-xs mb-1.5 block">Password</label>
              <input
                id="pass"
                type="password"
                className="input"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-xs text-red-300" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
              </p>
            )}

            <button className="btn-primary w-full" disabled={busy}>
              <Lock className="h-4 w-4" aria-hidden />
              {busy ? 'Verifying…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-line bg-card p-3.5 text-xs text-muted">
            <div className="font-semibold text-ink">Demo access (SIH)</div>
            <div className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
              admin@roaddrive.gov.in / road2026
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
              <DemoBadge /> Frontend prototype — real auth server comes with the backend integration.
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-muted">
            Need access? Request credentials from the RoadDrive authority administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
