import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader, SeverityChip, StatusChip, EmptyState } from '../../components/common';
import { HAZARD_TYPE_META, fmtTime, fmtDateShort, cn } from '../../utils/severity';
import type { HazardStatus, Severity } from '../../types';

const SEVERITIES: (Severity | 'all')[] = ['all', 'critical', 'high', 'moderate', 'low'];
const STATUSES: (HazardStatus | 'all')[] = [
  'all', 'provisional', 'verified', 'assigned', 'under_repair', 'repaired', 'verification_pending', 'verification_failed',
];
const PAGE_SIZE = 12;

export default function HazardManagement() {
  const { api } = useStore();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [status, setStatus] = useState<HazardStatus | 'all'>('all');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'lastDetected', dir: -1 });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>(params.get('id') ? [params.get('id')!] : []);

  const filtered = useMemo(() => {
    let rows = api.getHazards();
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((h) => `${h.id} ${h.roadName} ${HAZARD_TYPE_META[h.type].label}`.toLowerCase().includes(q));
    }
    if (sev !== 'all') rows = rows.filter((h) => h.severity === sev);
    if (status !== 'all') rows = rows.filter((h) => h.status === status);
    rows = [...rows].sort((a, b) => {
      const av = (a as any)[sort.key] ?? '';
      const bv = (b as any)[sort.key] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
    return rows;
  }, [api, query, sev, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const th = (key: string, label: string) => (
    <th className="th">
      <button
        className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink"
        onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === -1 ? 1 : -1 }))}
      >
        {label}
        {sort.key === key && <span aria-hidden>{sort.dir === 1 ? '↑' : '↓'}</span>}
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hazard Management"
        sub={`${filtered.length} of ${api.getHazards().length} hazards`}
        right={
          selected.length > 0 && (
            <span className="chip border-primary-500/30 bg-primary-500/15 text-primary-300">{selected.length} selected</span>
          )
        }
      />

      {/* filters */}
      <section className="card card-pad space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              className="input pl-9"
              placeholder="Search ID, road, type…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              aria-label="Search hazards"
            />
          </div>
          <select className="input max-w-40" value={sev} onChange={(e) => { setSev(e.target.value as any); setPage(0); }} aria-label="Filter by severity">
            {SEVERITIES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All severities' : s}</option>)}
          </select>
          <select className="input max-w-48" value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(0); }} aria-label="Filter by status">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </section>

      {/* table */}
      {filtered.length === 0 ? (
        <EmptyState title="No active hazards" body="No hazards match the current filters. Road conditions currently look clear." />
      ) : (
        <section className="card overflow-hidden">
          <div className="rd-scroll overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-soft">
                <tr>
                  <th className="th w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={allOnPage}
                      onChange={() => setSelected(allOnPage ? selected.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...selected, ...pageRows.map((r) => r.id)])])}
                    />
                  </th>
                  {th('id', 'ID')}
                  <th className="th">Type</th>
                  <th className="th">Location</th>
                  {th('severity', 'Severity')}
                  {th('confidence', 'Confidence')}
                  {th('confirmationCount', 'Confirmations')}
                  {th('firstDetected', 'First detected')}
                  {th('lastDetected', 'Last detected')}
                  <th className="th">Status</th>
                  <th className="th">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((h) => (
                  <tr key={h.id} className={cn('hover:bg-soft', selected.includes(h.id) && 'bg-primary-500/15/50')}>
                    <td className="td">
                      <input type="checkbox" aria-label={`Select ${h.id}`} checked={selected.includes(h.id)} onChange={() => toggle(h.id)} />
                    </td>
                    <td className="td font-bold text-ink">{h.id}</td>
                    <td className="td">{HAZARD_TYPE_META[h.type].label}</td>
                    <td className="td">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted" aria-hidden />
                        {h.roadName}
                      </span>
                    </td>
                    <td className="td"><SeverityChip severity={h.severity} /></td>
                    <td className="td font-semibold">{h.confidence}%</td>
                    <td className="td font-semibold">{h.confirmationCount}</td>
                    <td className="td">{fmtDateShort(h.firstDetected)} {fmtTime(h.firstDetected)}</td>
                    <td className="td">{fmtDateShort(h.lastDetected)} {fmtTime(h.lastDetected)}</td>
                    <td className="td"><StatusChip status={h.status} /></td>
                    <td className="td">
                      <Link className="font-semibold text-primary-300 hover:underline" to={`/admin/hazards?id=${h.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* pagination */}
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <span className="text-xs text-muted">
              Page {page + 1} of {pages}
            </span>
            <div className="flex gap-1.5">
              <button className="btn-secondary !px-2.5 !py-1.5" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="btn-secondary !px-2.5 !py-1.5" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
