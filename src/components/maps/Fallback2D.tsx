import type { Hazard } from '../../types';
import { SEVERITY_META } from '../../utils/severity';

/**
 * Polished 2D fallback when the 3D provider is unavailable (spec §5.4).
 * Uses a lightweight SVG projection — zero external dependencies.
 */
export function Fallback2D({
  hazards,
  height = 560,
  onSelect,
}: {
  hazards: Hazard[];
  height?: number;
  onSelect?: (h: Hazard) => void;
}) {
  const latMin = 28.35,
    latMax = 28.53,
    lngMin = 76.97,
    lngMax = 77.12;
  const x = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * 100;
  const y = (lat: number) => 100 - ((lat - latMin) / (latMax - latMin)) * 100;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-gray-700 bg-[#0e141b]"
      style={{ height }}
      role="img"
      aria-label="2D fallback map of hazards"
    >
      {/* grid */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="grid" width="6.25" height="8.33" patternUnits="userSpaceOnUse">
            <path d="M 6.25 0 L 0 0 0 8.33" fill="none" stroke="#1d2732" strokeWidth="0.15" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        {hazards.slice(0, 60).map((h) => (
          <g key={h.id} onClick={() => onSelect?.(h)} className="cursor-pointer">
            <circle
              cx={x(h.longitude)}
              cy={y(h.latitude)}
              r={h.severity === 'critical' ? 1.4 : 1}
              fill={SEVERITY_META[h.severity].hex}
              stroke="#fff"
              strokeWidth="0.25"
            />
          </g>
        ))}
      </svg>
      <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-2 text-[10px] font-semibold text-white">
        2D fallback mode — 3D scene unavailable in this browser
      </div>
    </div>
  );
}
