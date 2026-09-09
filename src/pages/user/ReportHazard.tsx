import { useState } from 'react';
import { Check, Camera, MapPin, Send } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { HAZARD_TYPE_META, SEVERITY_META, cn } from '../../utils/severity';
import type { HazardType, Severity } from '../../types';
import { HOME } from '../../data/geoBase';

const TYPES: HazardType[] = ['pothole', 'waterlogging', 'open_manhole', 'debris', 'damaged_road', 'broken_speed_breaker', 'other'];
const SEVERITIES: Severity[] = ['low', 'moderate', 'high', 'critical'];

export default function ReportHazard() {
  const { api } = useStore();
  const [type, setType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState('');

  const submit = () => {
    if (!type || !severity) {
      setError('Select a hazard type and severity.');
      return;
    }
    const id = api.submitReport({ type, severity, description, lat: HOME[0] + 0.0031, lng: HOME[1] - 0.0021 });
    setSubmitted(id);
  };

  if (submitted) {
    return (
      <div className="card card-pad mt-8 grid place-items-center py-12 text-center">
        <Check className="h-10 w-10 text-green-600" aria-hidden />
        <h2 className="mt-2 text-lg font-bold text-ink">Report submitted</h2>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          {submitted} — your report will be compared with nearby observations to build confidence.
        </p>
        <button className="btn-primary mt-4" onClick={() => { setSubmitted(null); setType(null); setSeverity(null); setDescription(''); setPhoto(false); }}>
          Report another hazard
        </button>
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
                type === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
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
                severity === s ? 'text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
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
          className={cn('btn w-full', photo ? 'border-green-300 bg-green-50 text-green-700' : 'btn-secondary')}
          onClick={() => setPhoto(true)}
        >
          <Camera className="h-4 w-4" aria-hidden /> {photo ? 'Photo attached ✓' : 'Attach photo'}
        </button>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400" aria-hidden />
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

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <button className="btn-primary w-full" onClick={submit}>
        <Send className="h-4 w-4" aria-hidden /> Submit report
      </button>
    </div>
  );
}
