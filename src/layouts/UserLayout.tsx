import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Map as MapIcon,
  CarFront,
  Route,
  Flag,
  History,
  Truck,
  User,
  Bell,
} from 'lucide-react';
import { cn } from '../utils/severity';
import { DemoBadge } from '../components/common';
import { useStore } from '../api/store';
import { timeAgo } from '../utils/severity';

const NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/map', label: 'Map', icon: MapIcon },
  { to: '/app/drive', label: 'Drive', icon: CarFront },
  { to: '/app/routes', label: 'Routes', icon: Route },
  { to: '/app/reports', label: 'Reports', icon: Flag },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/vehicle', label: 'Vehicle', icon: Truck },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export default function UserLayout() {
  const { api } = useStore();
  const unread = api.getNotifications('user').filter((n) => !n.read).length;
  const latest = api.getNotifications('user')[0];
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white" aria-hidden>
              <Route className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight text-ink">RoadDrive AI</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Driver</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DemoBadge />
            <NavLink
              to="/app/profile"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-white/10"
              state={{ tab: 'notifications' }}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-severity-critical px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          </div>
        </div>
        {latest && !latest.read && location.pathname === '/app' && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300">
              <span className="font-semibold">{latest.title}</span> — {latest.body}{' '}
              <span className="text-blue-400">({timeAgo(latest.createdAt)})</span>
            </div>
          </div>
        )}
      </header>

      {/* page */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 lg:pb-8" id="main">
        <Outlet />
      </main>

      {/* bottom nav (mobile-first) */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 px-1">
          {NAV.filter((n) => ['Home', 'Map', 'Drive', 'Routes', 'Reports'].includes(n.label)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors duration-200',
                  isActive ? 'text-primary-300' : 'text-gray-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon className={cn('h-5 w-5 transition-transform duration-300', isActive && 'scale-110')} aria-hidden />
                  {isActive && (
                    <span
                      className="rd-nav-indicator absolute -bottom-0.5 h-1 w-6 rounded-full bg-primary-600"
                      aria-hidden
                    />
                  )}
                  {n.label}
                  {n.label === 'Drive' && (
                    <span className="absolute -mt-9 rounded-full bg-primary-600 px-2 py-0.5 text-[9px] text-white shadow-card">LIVE</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* desktop side rail (≥lg) — full nav moves here */}
      <nav
        aria-label="Primary desktop"
        className="fixed left-0 top-0 z-20 hidden h-full w-56 flex-col gap-1 border-r border-line bg-card p-3 lg:flex"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
          >
            <n.icon className="h-4.5 w-4.5" aria-hidden />
            {n.label}
          </NavLink>
        ))}
        <div className="mt-auto rounded-lg border border-line bg-white/5 p-3 text-[11px] leading-relaxed text-gray-400">
          Privacy protected — faces and license plates are blurred before evidence is stored.
        </div>
      </nav>
      {/* indent main content on desktop */}
      <style>{`@media (min-width:1024px){ #main { margin-left: 14rem; } }`}</style>
    </div>
  );
}
