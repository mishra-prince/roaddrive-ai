import { useState } from 'react';
import { Camera, MapPin, Send, Mail, Merge, FilePlus2 } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader, SeverityChip } from '../../components/common';
import { EmailPreviewModal } from '../../components/common/EmailPreviewModal';
import { HAZARD_TYPE_META, SEVERITY_META, cn } from '../../utils/severity';
import type { HazardType, Severity, ReportOutcome } from '../../types';
import { HOME } from '../../data/geoBase';

const TYPES: HazardType[] = ['pothole', 'waterlogging', 'open_manhole', 'debris', 'damaged_road', 'broken_speed_breaker', 'other'];
const SEVERITIES: Severity[] = ['low', 'moderate', 'high', 'critical'];

export default function ReportHazard() {
  const { api } = useStore();
  const [type, setType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(false);
  const [outcome, setOutcome] = useState<ReportOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  const submit = async () => {
    if (!type || !severity) {
      setError('Select a hazard type and severity.');
      return;
    }
    setBusy(true);
    setError('');
    // Simulated GPS sits on MG Road — deterministic: lands on PH-1024 (dedup match).
    const res = await api.submitReport({
      type,
      severity,
      description,
      lat: HOME[0] + 0.0031,
      lng: HOME[1] - 0.0021,
      to: 'alex.driver@example.com',
    });
    setBusy(false);
    setOutcome(res);
  };

  const reset = () => {
    setOutcome(null);
    setType(null);
    setSeverity(null);
    setDescription('');
    setPhoto(false);
    setShowEmail(false);
  };

  // ── success: dual acknowledgement ──
  if (outcome) {
    const email = outcome.emailId ? api.getEmails().find((e) => e.id === outcome.emailId) : undefined;
    const matched = outcome.matched;
    return (
      <div className="space-y-4">
        <div className="card card-pad mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full', matched ? 'bg-blue-500/15 text-blue-300' : 'bg-green-500/15 text-green-300')}>
              {matched ? <Merge className="h-5 w-5" aria-hidden /> : <FilePlus2 className="h-5 w-5" aria-hidden />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{matched ? 'Matched an existing hazard' : 'New case filed'}</h2>
              <p className="mt-0.5 text-sm text-muted">{outcome.message}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-soft p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-ink">{outcome.hazardId}</span>
              {matched ? (
                <span className="chip border-blue-500/30 bg-blue-500/10 text-blue-300">
                  {outcome.confirmationCount} confirmations
                </span>
              ) : (
                <SeverityChip severity={severity ?? 'moderate'} />
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              {matched
                ? 'Instead of filing a duplicate, your observation was counted as an independent confirmation. One pothole = one case — your report still raises its priority.'
                : 'Yours was the first report for this defect, so it opened a new tracking case visible to the road authority.'}
            </p>
          </div>

          {email && (
            <button className="btn-secondary w-full !justify-start gap-2" onClick={() => setShowEmail(true)}>
              <Mail className="h-4 w-4 text-primary-400" aria-hidden />
              <span className="text-left">
                <span className="block text-xs font-semibold text-ink">Acknowledgement email sent</span>
                <span className="block truncate text-[11px] text-muted">{email.subject}</span>
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={reset}>Report another hazard</button>
          </div>
        </div>

        {showEmail && email && <EmailPreviewModal email={email} onClose={() => setShowEmail(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Report Hazard" sub="Your report joins nearby observations" />

      <section className="card card-pad">
        <div className="label-xs mb-2">Hazard type</div>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors',
                type === t ? 'border-primary-500 bg-primary-500/15 text-primary-300' : 'border-line bg-soft text-muted hover:border-line',
              )}
              onClick={() => setType(t)}
              aria-pressed={type === t}
            >
              {HAZARD_TYPE_META[t].label}
            </button>
          ))}
        </div>
      </section>

      <section className="card card-pad">
        <div className="label-xs mb-2">Severity (your estimate)</div>
        <div className="grid grid-cols-4 gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={cn(
                'rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors',
                severity === s ? 'text-white' : 'border-line bg-soft text-muted hover:border-line',
              )}
              style={severity === s ? { background: SEVERITY_META[s].hex, borderColor: SEVERITY_META[s].hex } : undefined}
              onClick={() => setSeverity(s)}
              aria-pressed={severity === s}
            >
              {SEVERITY_META[s].label}
            </button>
          ))}
        </div>
      </section>

      <section className="card card-pad space-y-3">
        <button
          className={cn('btn w-full', photo ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'btn-secondary')}
          onClick={() => setPhoto(true)}
        >
          <Camera className="h-4 w-4" aria-hidden /> {photo ? 'Photo attached ✓' : 'Attach photo'}
        </button>
        <div className="flex items-center gap-2 rounded-lg bg-soft px-3 py-2.5 text-xs text-muted">
          <MapPin className="h-4 w-4 text-muted" aria-hidden />
          Current location — 28.4765, 77.0765 (GPS simulated)
        </div>
        <div>
          <label htmlFor="desc" className="label-xs mb-1 block">Description (optional)</label>
          <textarea
            id="desc"
            className="input min-h-[72px]"
            placeholder="e.g. Deep pothole near the bus stop, right lane"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

      <button className="btn-primary w-full" onClick={submit} disabled={busy}>
        <Send className="h-4 w-4" aria-hidden /> {busy ? 'Submitting…' : 'Submit report'}
      </button>
      <p className="text-center text-[11px] text-muted">
        Duplicate reports for the same defect are counted as confirmations, not new cases.
      </p>
    </div>
  );
}