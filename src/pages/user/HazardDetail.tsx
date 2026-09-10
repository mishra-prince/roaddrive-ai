import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, Flag, MapPin, ShieldCheck, Clock, Users, CarFront } from 'lucide-react';
import { useStore } from '../../api/store';
import { SeverityChip, ConfidenceBar, PageHeader, EmptyState } from '../../components/common';
import { HAZARD_TYPE_META, fmtDateTime, fmtTime, timeAgo, SEVERITY_META } from '../../utils/severity';
import { VEHICLE_CLASS_META } from '../../utils/severity';
import type { VehicleType } from '../../types';
import { evidenceUrl } from '../../data/evidence';

export default function HazardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useStore();
  const [justConfirmed, setJustConfirmed] = useState(false);
  const h = id ? api.getHazardById(id) : undefined;

  if (!h) {
    return (
      <EmptyState
        title="Hazard not found"
        body="This hazard may have been resolved or the link is invalid."
        action={<button className="btn-secondary" onClick={() => navigate('/app/map')}>Back to map</button>}
      />
    );
  }

  // vehicle-specific risk table (spec §16)
  const classes: VehicleType[] = ['motorcycle', 'scooter', 'sedan', 'suv'];
  const riskFor = (vt: VehicleType) => {
    const base = h.riskScore;
    const mult = vt === 'motorcycle' ? 1.18 : vt === 'scooter' ? 1.22 : vt === 'sedan' ? 1.0 : 0.68;
    return Math.min(99, Math.round(base * mult));
  };

  return (
    <div className="space-y-4">
      <PageHeader title={`${HAZARD_TYPE_META[h.type].label} ${h.id}`} sub={`${h.roadName} · ${fmtDateTime(h.firstDetected)}`} />

      {/* evidence */}
      <img
        src={h.evidenceImage ?? evidenceUrl(h.type, h.severity, h.id)}
        alt={`Evidence frame for ${HAZARD_TYPE_META[h.type].label} ${h.id} — faces and plates blurred`}
        className="w-full rounded-xl border border-line object-cover shadow-card"
      />

      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={h.severity} size="md" />
        <span className="chip border-line bg-white/5 text-gray-300">{h.status.replace('_', ' ')}</span>
      </div>

      {/* metrics */}
      <section className="card card-pad space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <div className="label-xs">Risk score</div>
            <div className="text-xl font-bold" style={{ color: SEVERITY_META[h.severity].hex }}>{h.riskScore}/100</div>
          </div>
          <div>
            <div className="label-xs">Affected width</div>
            <div className="text-xl font-bold text-ink">~{h.affectedWidthM ?? '—'}{h.affectedWidthM ? ' m' : ''}</div>
          </div>
        </div>
        <ConfidenceBar value={h.confidence} />
        <div className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden /> Confirmed by <b className="text-ink">{h.confirmationCount}</b> vehicles</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> Last detected {timeAgo(h.lastDetected)}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden /> {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</span>
          <span className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" aria-hidden /> First {fmtDateTime(h.firstDetected)}</span>
        </div>
      </section>

      {/* vehicle-specific risk */}
      <section className="card card-pad">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <CarFront className="h-4 w-4" aria-hidden /> Risk by vehicle type
        </h3>
        <div className="space-y-2">
          {classes.map((vt) => {
            const r = riskFor(vt);
            const tone = r >= 75 ? 'text-red-400' : r >= 50 ? 'text-orange-400' : 'text-green-400';
            const bar = r >= 75 ? '#EF4444' : r >= 50 ? '#F97316' : '#22C55E';
            return (
              <div key={vt} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-gray-300">{VEHICLE_CLASS_META[vt]}</span>
                <div className="h-2 flex-1 rounded-full bg-gray-200" role="presentation">
                  <div className="h-2 rounded-full" style={{ width: `${r}%`, background: bar }} />
                </div>
                <span className={`w-12 text-right text-xs font-bold ${tone}`}>{r}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">Higher score = higher risk for that vehicle class (estimated).</p>
      </section>

      {/* confirmation timeline */}
      <section className="card card-pad">
        <h3 className="mb-3 text-sm font-bold text-ink">Independent confirmations</h3>
        <ol className="relative space-y-3 border-l-2 border-line pl-4">
          {h.observations.slice(-6).reverse().map((o, i) => (
            <li key={i} className="text-xs">
              <span className="absolute -left-[5px] h-2 w-2 rounded-full bg-primary-500/150" style={{ marginTop: 2 }} />
              <div className="font-semibold text-gray-300">{o.vehicleId} {o.matched ? 'confirmed' : 'first detection'}</div>
              <div className="text-gray-400">{fmtTime(o.detectedAt)} · {timeAgo(o.detectedAt)}</div>
            </li>
          ))}
        </ol>
        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-gray-400">
          Observations are anonymous — vehicle IDs only, no personal information.
        </div>
      </section>

      {/* actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-primary"
          onClick={() => {
            api.confirmHazard(h.id);
            setJustConfirmed(true);
          }}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden /> {justConfirmed ? 'Confirmed ✓' : 'Confirm Hazard'}
        </button>
        <button className="btn-secondary" onClick={() => api.reportIncorrect(h.id)}>
          <Flag className="h-4 w-4" aria-hidden /> Report Incorrect
        </button>
        <button className="col-span-2 btn-ghost !text-xs" onClick={() => navigate('/app/map')}>
          <MapPin className="h-4 w-4" aria-hidden /> View on Map
        </button>
      </div>

      {justConfirmed && (
        <p className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Thanks — your confirmation was added. Confidence increases with each independent detection.
        </p>
      )}
    </div>
  );
}
