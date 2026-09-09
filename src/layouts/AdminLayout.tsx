import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  AlertTriangle,
  BadgeCheck,
  Wrench,
  BarChart3,
  Users,
  Settings,
  Radio,
} from 'lucide-react';
import { cn } from '../utils/severity';
import { DemoBadge } from '../components/common';
import { useStore } from '../api/store';
import { useState } from 'react';
import DemoPanel from '../components/admin/DemoPanel';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/map', label: 'Live Map', icon: Globe2 },
  { to: '/admin/hazards', label: 'Hazards', icon: AlertTriangle },
  { to: '/admin/verification', label: 'Verification', icon: BadgeCheck },
  { to: '/admin/repairs', label: 'Repairs', icon: Wrench },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { api, state } = useStore();
  const unread = api.getNotifications('admin').filter((n) => !n.read).length;
  const pending = api.getHazards().filter((h) => h.status === 'provisional').length;
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-screen bg-surface">
      {/* sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-gray-200 bg-white transition-all',
          collapsed ? 'w-[64px]' : 'w-60',
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-gray-200 px-4 py-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-700 text-white" aria-hidden>
            <Radio className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-ink">RoadDrive Authority</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Command Center</div>
            </div>
          )}
        </div>
        <nav aria-label="Admin primary" className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={n.label}
              className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active', collapsed && 'justify-center px-2')}
            >
              <n.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
              {!collapsed && n.label}
              {!collapsed && n.label === 'Verification' && pending > 0 && (
                <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-2">
          <button
            className={cn('nav-item w-full', collapsed && 'justify-center px-2')}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Settings className="h-4.5 w-4.5" aria-hidden />
            {!collapsed && 'Collapse sidebar'}
          </button>
        </div>
      </aside>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <DemoBadge />
            <span className="hidden text-sm text-gray-500 md:inline">
              {unread > 0 ? `${unread} unread alerts` : 'No unread alerts'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary !py-1.5 text-xs" onClick={() => navigate('/admin/verification')}>
              Verification queue
              {pending > 0 && <span className="rounded-full bg-purple-100 px-1.5 text-[10px] font-bold text-purple-700">{pending}</span>}
            </button>
            <button
              className="btn-primary !py-1.5 text-xs"
              onClick={() => api.resetDemo()}
              title="Reset all simulated state to the seeded dataset"
            >
              Reset demo
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 sm:flex">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700" aria-hidden>
                RM
              </div>
              <span className="text-xs font-semibold text-ink">Road Authority</span>
            </div>
          </div>
        </header>

        {/* demo scenario banner appears when any simulation has run */}
        {state.simulated && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-1.5 text-xs text-amber-800">
            <span>Simulated state active — changes persist until you reset the demo.</span>
            <button className="font-semibold underline" onClick={() => api.resetDemo()}>
              Reset now
            </button>
          </div>
        )}

        <main className="min-w-0 flex-1 p-5">
          <Outlet />
        </main>

        {/* floating demo controls */}
        <DemoPanel />
      </div>
    </div>
  );
}
