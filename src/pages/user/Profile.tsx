import { NavLink, useLocation } from 'react-router-dom';
import { User, Bell, ShieldCheck, Info, Route } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { timeAgo, cn } from '../../utils/severity';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'about', label: 'About', icon: Info },
];

export default function Profile() {
  const { api } = useStore();
  const location = useLocation();
  const initial = (location.state as { tab?: string } | null)?.tab ?? 'profile';
  const notifications = api.getNotifications('user');

  return (
    <div className="space-y-4">
      <PageHeader title="Profile" />

      {/* tabs */}
      <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={`/app/profile`}
            state={{ tab: t.id }}
            className={({ isActive }) => cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold',
              (isActive && t.id === initial) || (!isActive && t.id === initial) ? 'bg-primary-600 text-white' : 'bg-card text-gray-400 border border-line',
            )}
            aria-current={t.id === initial ? 'page' : undefined}
          >
            <t.icon className="h-3.5 w-3.5" aria-hidden />
            {t.label}
          </NavLink>
        ))}
      </nav>

      {initial === 'profile' && (
        <section className="card card-pad flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-500/20 text-lg font-bold text-primary-300" aria-hidden>
            A
          </div>
          <div>
            <div className="text-lg font-bold text-ink">Alex</div>
            <div className="text-sm text-gray-400">Driver · Gurugram</div>
            <div className="mt-1 text-xs text-gray-400">Contributing road observations since Aug 2026</div>
          </div>
        </section>
      )}

      {initial === 'notifications' && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Notifications</h3>
            <button className="btn-ghost !py-1 !text-xs" onClick={() => api.markNotificationsRead('user')}>
              Mark all read
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="card card-pad text-sm text-gray-400">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <article key={n.id} className={cn('card card-pad', !n.read && 'border-l-4 border-l-primary-500')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-ink">{n.title}</div>
                    <div className="mt-0.5 text-xs text-gray-400">{n.body}</div>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                </div>
              </article>
            ))
          )}
          <p className="text-[11px] text-gray-400">Alerts are rate-limited to avoid spam while driving.</p>
        </section>
      )}

      {initial === 'privacy' && (
        <section className="card card-pad space-y-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-400" aria-hidden />
            <h3 className="text-sm font-bold text-ink">Privacy protected</h3>
          </div>
          <p>
            Sensitive information such as faces and license plates is automatically blurred before evidence is stored.
            Observations are stored anonymously — vehicle IDs only, never personal identifiers.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li>No personal information exposed in confirmations</li>
            <li>Contributions shown as anonymous vehicle IDs (e.g. Vehicle #A72)</li>
            <li>Evidence frames blurred at capture (simulated in demo)</li>
          </ul>
        </section>
      )}

      {initial === 'about' && (
        <section className="card card-pad space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2 text-ink">
            <Route className="h-5 w-5 text-primary-600" aria-hidden />
            <h3 className="text-sm font-bold">RoadDrive AI</h3>
          </div>
          <p>
            Real-time crowdsourced road-driveability intelligence: ordinary vehicles detect hazards, the system
            validates them across users, warns approaching drivers, and gives authorities a live operational picture.
          </p>
          <p className="text-xs text-gray-400">
            Frontend prototype — all detection, GPS, routing and verification are simulated with deterministic mock data.
          </p>
        </section>
      )}
    </div>
  );
}
