/**
 * Live pothole detection over the device camera.
 * Grabs frames from the <video> element, POSTs them to the detection API
 * (FastAPI + our YOLO best.pt), and returns normalized boxes to overlay.
 */
import { useEffect, useRef, useState } from 'react';

export type DetBox = {
  /** normalized 0..1 coords relative to the video frame */
  x: number; y: number; w: number; h: number;
  conf: number;
};

// detection API base: set via VITE_DETECT_API, fallback to the tunnel
const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_DETECT_API ||
  'https://verbal-moments-yen-missed.trycloudflare.com';

const IMG_SCALE = 384;      // matches training imgsz
const INTERVAL_MS = 900;    // one inference per ~0.9 s
const MIN_CONF = 0.25;

export function usePotholeDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [boxes, setBoxes] = useState<DetBox[]>([]);
  const [fps, setFps] = useState(0);
  const busy = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) { setBoxes([]); return; }

    const canvas = document.createElement('canvas');
    canvas.width = IMG_SCALE;
    canvas.height = IMG_SCALE;

    const tick = async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2 || busy.current) return;
      busy.current = true;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // center-crop the video into a square, like the API expects
        const s = Math.min(v.videoWidth, v.videoHeight);
        const sx = (v.videoWidth - s) / 2, sy = (v.videoHeight - s) / 2;
        ctx.drawImage(v, sx, sy, s, s, 0, 0, IMG_SCALE, IMG_SCALE);
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.7));
        if (!blob) return;
        const form = new FormData();
        form.append('file', blob, 'frame.jpg');
        const res = await fetch(`${API_BASE}/detect`, { method: 'POST', body: form });
        if (!res.ok) return;
        const data = (await res.json()) as {
          detections?: { bbox_px: [number, number, number, number]; conf: number }[];
        };
        const dets = (data.detections ?? [])
          .filter((d) => d.conf >= MIN_CONF)
          .map((d) => {
            const [x1, y1, x2, y2] = d.bbox_px;
            return {
              x: x1 / IMG_SCALE, y: y1 / IMG_SCALE,
              w: (x2 - x1) / IMG_SCALE, h: (y2 - y1) / IMG_SCALE,
              conf: d.conf,
            };
          });
        setBoxes(dets);
        setFps(Math.round(1000 / INTERVAL_MS));
      } catch {
        /* keep camera alive even if the API blips */
      } finally {
        busy.current = false;
      }
    };

    timer.current = window.setInterval(tick, INTERVAL_MS);
    return () => { if (timer.current) window.clearInterval(timer.current); setBoxes([]); };
  }, [videoRef, enabled]);

  return { boxes, fps, apiBase: API_BASE };
}
