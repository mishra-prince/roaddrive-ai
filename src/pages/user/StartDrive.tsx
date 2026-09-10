import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Gauge, Satellite, ScanEye, Signal, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useStore } from '../../api/store';
import { useCamera } from '../../hooks/useCamera';
import { Camera as CamIcon, CameraOff } from 'lucide-react';
import { cn } from '../../utils/severity';
import { SEVERITY_META } from '../../utils/severity';

/**
 * LIVE DRIVE — deterministic detection state machine (spec §11):
 * scanning → hazard detected → location acquired → nearby reports checked →
 * existing hazard matched → confirmation added. No random events: the demo
 * always lands on PH-1024 with exact expected values.
 */

type Phase =
  | 'scanning'
  | 'detected'
  | 'locating'
  | 'checking'
  | 'matched'
  | 'confirmed'
  | 'alerting';

const PHASE_MS = 2600;
const SPEC = { id: 'PH-1024', type: 'pothole' as const, severity: 'high' as const, confidence: 94, risk: 84, aheadM: 120 };

const PHASE_TEXT: Record<Phase, string> = {
  scanning: 'Scanning road surface…',
  detected: 'Hazard detected',
  locating: 'Location acquired',
  checking: 'Checking nearby reports…',
  matched: 'Existing hazard matched',
  confirmed: 'Confirmation added',
  alerting: 'Warning issued to approaching drivers',
};

const ORDER: Phase[] = ['scanning', 'detected', 'locating', 'checking', 'matched', 'confirmed', 'alerting'];

export default function StartDrive() {
  const { api, pushDriveLog } = useStore();
  const navigate = useNavigate();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const cam = useCamera();
  const [speed, setSpeed] = useState(38);
  const confirmedRef = useRef(false);
  const phase = ORDER[phaseIdx];

  // advance the machine on a fixed cadence
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setPhaseIdx((i) => (i + 1 < ORDER.length ? i + 1 : i));
    }, PHASE_MS);
    return () => clearTimeout(t);
  }, [running, phaseIdx]);

  // side effects at specific phases
  useEffect(() => {
    if (!running) return;
    if (phase === 'confirmed' && !confirmedRef.current) {
      confirmedRef.current = true;
      const h = api.getHazards().find((x) => x.id === SPEC.id);
      if (h) {
        api.confirmHazard(SPEC.id, 'You (this vehicle)');
        pushDriveLog('Hazard confirmed', `PH-1024 confirmations ${h.confirmationCount} → ${h.confirmationCount + 1}`);
      }
    }
    if (phase === 'detected') setSpeed(34);
    if (phase === 'alerting') setSpeed(30);
  }, [phase, running, api, pushDriveLog]);

  const hazard = api.getHazards().find((h) => h.id === SPEC.id);
  const showAlert = phase === 'matched' || phase === 'confirmed' || phase === 'alerting';

  return (
    <div className="space-y-4 pb-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', running ? 'bg-red-500 rd-anim-pulse' : 'bg-gray-300')} />
            <h1 className="text-lg font-bold tracking-tight text-ink">{running ? 'LIVE DRIVE' : 'Start Drive'}</h1>
          </div>
          <p className="text-xs text-muted">{running ? PHASE_TEXT[phase] : 'Detect road hazards while you drive'}</p>
        </div>
        <button
          className={cam.state === 'live' ? 'btn-secondary !px-3' : 'btn-secondary !px-3'}
          onClick={() => (cam.state === 'live' ? cam.stop() : cam.start())}
          title={cam.state === 'live' ? 'Stop real camera' : 'Use real device camera'}
          aria-label={cam.state === 'live' ? 'Stop camera' : 'Start camera'}
        >
          {cam.state === 'live' ? <CameraOff className="h-4 w-4" aria-hidden /> : <CamIcon className="h-4 w-4 text-primary-600" aria-hidden />}
        </button>
        <button
          className={running ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            if (running) {
              setRunning(false);
              setPhaseIdx(0);
              confirmedRef.current = false;
              setSpeed(38);
            } else {
              setRunning(true);
              setPhaseIdx(0);
            }
          }}
        >
          {running ? 'End Drive' : 'Start Drive'}
        </button>
      </div>

      {/* camera: real device feed when active, simulated road otherwise */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#1a222b]">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* LIVE camera layer (real device feed) */}
          {cam.state === 'live' && (
            <video
              ref={cam.videoRef}
              className="absolute inset-0 h-full w-full bg-black object-cover"
              muted
              playsInline
              autoPlay
              aria-label="Live camera feed"
            />
          )}
          {/* moving road (simulated feed — hidden when camera is live) */}
          {cam.state !== 'live' && (
            <>
              <div className="absolute inset-0 grid grid-rows-2">
                <div className="bg-gradient-to-b from-[#93a3b3] to-[#6b7682]" />
                <div className="bg-[#3b444d]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 top-1/2 grid grid-cols-3" aria-hidden>
                <div className="border-r-4 border-[#4b545d] bg-[#454e58]" />
                <div className="relative overflow-hidden bg-[#31383f]">
                  <div className="absolute inset-x-0 -top-1/2 h-[200%]">
                    <div className="rd-anim-road absolute inset-0 grid grid-rows-8">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="grid place-items-center">
                          <div className="h-10 w-2 rounded bg-[#e8edf2] opacity-90" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute left-[46%] top-[62%] h-20 w-16 rounded-[40%] bg-[#20262c] opacity-90" />
                  <div className="absolute left-[42%] top-[55%] h-14 w-24 rounded-[45%] bg-[#171c22] opacity-95" />
                </div>
                <div className="border-l-4 border-[#4b545d] bg-[#454e58]" />
              </div>
            </>
          )}

          {/* honest indicator over the real camera feed */}
          {cam.state === 'live' && (
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
              <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold text-white/90">
                Live camera · detection simulation off
              </span>
            </div>
          )}

          {/* scan line */}
          {running && phase === 'scanning' && cam.state !== 'live' && (
            <div className="rd-anim-scan absolute inset-x-6 z-10 h-0.5 rounded bg-emerald-300 shadow-[0_0_18px_4px_rgba(110,231,183,0.45)]" />
          )}

          {/* detection box — simulated feed only; never overlaid on the real camera */}
          {(phase !== 'scanning' || !running) && cam.state !== 'live' && (
            <div
              className="absolute left-[38%] top-[52%] h-24 w-32 rounded-md border-2 z-10"
              style={{
                borderColor: SEVERITY_META[SPEC.severity].hex,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.35), 0 0 24px 2px ${SEVERITY_META[SPEC.severity].hex}55`,
              }}
            >
              <span
                className="absolute -top-7 left-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: SEVERITY_META[SPEC.severity].hex }}
              >
                POTHOLE {SPEC.confidence}%
              </span>
              <span className="absolute -bottom-7 left-0 rounded bg-card/90 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                HIGH · risk {SPEC.risk}/100
              </span>
            </div>
          )}

          {/* HUD chips */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 rounded bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">
              <Camera className="h-3 w-3" aria-hidden /> {cam.state === 'live' ? 'Live camera' : 'Simulated feed'}
            </span>
            {running && (
              <span className="flex items-center gap-1.5 rounded bg-black/50 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                <ScanEye className="h-3 w-3" aria-hidden /> Detection active
              </span>
            )}
          </div>
          <div className="absolute right-3 top-3 rounded bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">
            {cam.state === 'live' ? 'Camera · live' : running ? PHASE_TEXT[phase] : 'Standby'}
          </div>
          <div className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">
            Faces &amp; plates blurred
          </div>
        </div>

        {/* telemetry strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-700 border-t border-gray-700 bg-[#141a20] text-center">
          {[
            { icon: Gauge, label: 'Speed', value: `${speed} km/h` },
            { icon: Satellite, label: 'GPS', value: 'Active' },
            { icon: ScanEye, label: 'Detection', value: running ? 'Active' : 'Standby' },
            { icon: Signal, label: 'Network', value: 'Good' },
          ].map((m) => (
            <div key={m.label} className="px-2 py-2">
              <div className="flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
                <m.icon className="h-3 w-3" aria-hidden /> {m.label}
              </div>
              <div className="text-xs font-bold text-white">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* pipeline steps */}
      <ol className="card card-pad space-y-2" aria-label="Detection pipeline">
        {ORDER.map((p, i) => (
          <li key={p} className="flex items-center gap-2.5 text-xs">
            <span
              className={cn(
                'grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold',
                i < phaseIdx || (running && i === phaseIdx)
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-line bg-card text-muted',
              )}
              aria-hidden
            >
              {i < phaseIdx ? '✓' : i + 1}
            </span>
            <span className={cn('font-medium', i === phaseIdx && running ? 'text-primary-300' : i < phaseIdx ? 'text-ink-soft' : 'text-muted')}>
              {PHASE_TEXT[p]}
            </span>
            {p === 'matched' && i <= phaseIdx && (
              <span className="ml-auto rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                {hazard ? `${hazard.confirmationCount} detections` : '3 → 4'}
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* live alert */}
      {running && showAlert && (
        <div className="overflow-hidden rounded-xl border-2" style={{ borderColor: SEVERITY_META.high.hex }}>
          <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white" style={{ background: SEVERITY_META.high.hex }}>
            High risk hazard
          </div>
          <div className="card-pad space-y-1 bg-card">
            <p className="text-sm font-bold text-ink">Pothole detected · {SPEC.aheadM} m ahead</p>
            <p className="text-sm text-muted">Estimated risk: {SPEC.risk}/100 · AI confidence {SPEC.confidence}%</p>
            <p className="text-xs text-muted">High risk for motorcycle · Moderate risk for sedan · Lower risk for SUV</p>
            <button className="btn-primary mt-2 w-full" onClick={() => setSpeed(24)}>
              <AlertTriangle className="h-4 w-4" aria-hidden /> Slow Down
            </button>
            <button className="btn-ghost w-full !text-xs" onClick={() => navigate('/app/routes')}>
              See alternative routes
            </button>
          </div>
        </div>
      )}

      {cam.state !== 'live' && (
        <p className="flex items-center gap-2 rounded-lg bg-soft px-3 py-2.5 text-[11px] text-muted">
          {cam.state === 'denied' ? <CameraOff className="h-4 w-4 shrink-0 text-muted" aria-hidden /> : <ShieldCheck className="h-4 w-4 shrink-0 text-muted" aria-hidden />}
          {cam.state === 'denied'
            ? 'Camera permission denied — using the simulated feed. Allow camera access in your browser to use the real one.'
            : cam.state === 'requesting'
              ? 'Requesting camera access…'
              : cam.state === 'unavailable'
                ? 'Camera unavailable on this device/connection — simulated feed active.'
                : 'Simulated camera feed for demo. Tap the camera button to use your real device camera — detection & matching stay deterministic.'}
        </p>
      )}
      {cam.state === 'live' && (
        <p className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2.5 text-[11px] text-green-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-400" aria-hidden />
          Live camera active — frames stay on your device; detection overlay &amp; hazard matching are simulated deterministically.
        </p>
      )}
    </div>
  );
}
