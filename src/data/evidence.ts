import type { HazardType, Severity } from '../types';
import { HAZARD_TYPE_META, SEVERITY_META } from '../utils/severity';

/**
 * Deterministic inline-SVG "camera frames" used as hazard evidence.
 * Fully self-contained data URLs — no external images, no network, no keys.
 * The blurred strip at the top represents the privacy pipeline (plate/face blur).
 */

const DEFECT_SHAPES: Record<HazardType, string> = {
  pothole: `
    <ellipse cx="320" cy="265" rx="86" ry="44" fill="#141a20"/>
    <ellipse cx="320" cy="262" rx="72" ry="34" fill="#2a323b"/>
    <ellipse cx="320" cy="260" rx="46" ry="20" fill="#3d4753"/>
    <path d="M234 265 l-34 -18 M406 265 l30 -22 M320 309 l6 26" stroke="#1c242c" stroke-width="6"/>
    <path d="M240 250 q40 -12 80 -2" stroke="#4a545f" stroke-width="4" fill="none" opacity="0.6"/>`,
  waterlogging: `
    <path d="M212 250 Q320 216 428 252 L436 292 Q320 322 204 290 Z" fill="#27506e" opacity="0.9"/>
    <path d="M232 258 Q320 232 408 260" stroke="#7fb2d9" stroke-width="5" fill="none" opacity="0.7"/>
    <path d="M250 276 Q320 258 386 278" stroke="#a9cbe4" stroke-width="3" fill="none" opacity="0.6"/>`,
  open_manhole: `
    <circle cx="320" cy="262" r="46" fill="#05080b"/>
    <circle cx="320" cy="262" r="52" fill="none" stroke="#5b6570" stroke-width="8"/>
    <circle cx="320" cy="262" r="24" fill="#10161c"/>`,
  debris: `
    <rect x="264" y="240" width="42" height="20" rx="3" fill="#6b5335" transform="rotate(-14 264 240)"/>
    <rect x="322" y="252" width="56" height="24" rx="3" fill="#7d6544" transform="rotate(8 322 252)"/>
    <rect x="292" y="282" width="34" height="16" rx="3" fill="#54422c" transform="rotate(-4 292 282)"/>
    <circle cx="384" cy="248" r="11" fill="#4c4a45"/>`,
  damaged_road: `
    <path d="M226 268 l60 -22 l44 30 l58 -34 l52 26" stroke="#161c22" stroke-width="14" fill="none"/>
    <path d="M240 252 l38 -14 M352 262 l30 18 M300 296 l-20 22" stroke="#2e3740" stroke-width="7"/>
    <path d="M262 262 l34 -10" stroke="#4d5761" stroke-width="4"/>`,
  broken_speed_breaker: `
    <rect x="220" y="248" width="70" height="22" rx="4" fill="#d7b93c"/>
    <rect x="306" y="248" width="34" height="22" rx="4" fill="#d7b93c"/>
    <rect x="356" y="248" width="64" height="22" rx="4" fill="#d7b93c"/>
    <path d="M298 246 l10 26 M344 244 l8 28" stroke="#1c242c" stroke-width="6"/>
    <path d="M230 258 h52 M364 258 h48" stroke="#b39a2c" stroke-width="4" opacity="0.8"/>`,
  other: `
    <path d="M320 226 l52 92 h-104 Z" fill="#1f2ysvo" />
    <path d="M320 226 l52 92 h-104 Z" fill="#232b34" stroke="#59626c" stroke-width="5"/>`,
};

export function evidenceUrl(type: HazardType, severity: Severity, id: string): string {
  const sev = SEVERITY_META[severity];
  const shape = DEFECT_SHAPES[type].replace(/#1f2ysvo/g, '');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#aab6c2"/><stop offset="1" stop-color="#cdd6de"/>
    </linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#58616b"/><stop offset="1" stop-color="#31383f"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#sky)"/>
  <rect y="180" width="640" height="220" fill="url(#road)"/>
  <path d="M-40 400 L300 180 h84 L700 400 Z" fill="#454e58"/>
  <path d="M318 190 l4 10 l0 12 l-6 12 l2 14" stroke="#e8edf2" stroke-width="6" stroke-dasharray="26 20" fill="none" opacity="0.9"/>
  <path d="M120 400 L268 182" stroke="#e8edf2" stroke-width="7" opacity="0.75"/>
  <path d="M524 400 L376 182" stroke="#e8edf2" stroke-width="7" opacity="0.75"/>
  <circle cx="90" cy="96" r="34" fill="#f2f5f8" opacity="0.5"/>
  ${shape}
  <rect x="18" y="18" width="150" height="26" rx="6" fill="#0f1720" opacity="0.55"/>
  <text x="30" y="36" font-family="sans-serif" font-size="13" fill="#e6edf3">Faces and plates blurred</text>
  <g>
    <rect x="452" y="286" width="168" height="92" rx="8" fill="#0f1720" opacity="0.82"/>
    <text x="468" y="312" font-family="sans-serif" font-size="13" font-weight="700" fill="#ffffff">${HAZARD_TYPE_META[type].label.toUpperCase()}</text>
    <text x="468" y="334" font-family="sans-serif" font-size="12" fill="#c8d2dc">${id} • ${sev.label.toUpperCase()} SEVERITY</text>
    <circle cx="474" cy="356" r="6" fill="${sev.hex}"/>
    <text x="488" y="361" font-family="sans-serif" font-size="12" fill="#c8d2dc">AI evidence frame</text>
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n\s*/g, ' '))}`;
}
