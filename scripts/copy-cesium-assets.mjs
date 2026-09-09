/**
 * Copies CesiumJS static assets (Widgets/Assets/Workers/ThirdParty) into
 * public/cesium so the 3D viewer works with zero API keys or CDNs.
 * Runs on postinstall; public/cesium is git-ignored to keep the repo light.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'node_modules', 'cesium', 'Build', 'Cesium');
const dst = join(process.cwd(), 'public', 'cesium');
if (!existsSync(src)) {
  console.warn('[postinstall] cesium package not found yet — skipping asset copy (run again after install)');
  process.exit(0);
}
mkdirSync(dst, { recursive: true });
for (const dir of ['Widgets', 'Assets', 'Workers', 'ThirdParty']) {
  const s = join(src, dir);
  const t = join(dst, dir);
  if (existsSync(s) && !existsSync(t)) {
    cpSync(s, t, { recursive: true });
    console.log('[postinstall] copied', dir);
  } else if (existsSync(t)) {
    console.log('[postinstall] present:', dir);
  }
}
console.log('[postinstall] cesium assets ready at public/cesium');
