import { useEffect, useRef, useState } from 'react';
import type { Hazard } from '../../types';
import { SEVERITY_META } from '../../utils/severity';
import { Fallback2D } from './Fallback2D';

/**
 * CesiumJS 3D map — God's-Eye-View-inspired command-center experience for the
 * authority interface. Self-hosted Cesium assets (no ion token, no API key).
 * Falls back to a polished 2D panel if Cesium fails to boot (spec §5.4).
 */

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

export function CesiumMap({
  hazards,
  height = 560,
  compact = false,
  focusHazardId,
  onSelect,
}: {
  hazards: Hazard[];
  height?: number;
  compact?: boolean;
  focusHazardId?: string | null;
  onSelect?: (h: Hazard) => void;
}) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const cesiumRef = useRef<any>(null);
  const entitiesRef = useRef<Map<string, any>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // boot once
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        window.CESIUM_BASE_URL = '/cesium';
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/cesium/Widgets/widgets.css';
        document.head.appendChild(link);
        const Cesium: any = await import('cesium');
        if (disposed || !hostRef.current) return;
        cesiumRef.current = Cesium;
        const viewer = new Cesium.Viewer(hostRef.current, {
          baseLayer: new Cesium.ImageryLayer(
            new Cesium.UrlTemplateImageryProvider({
              url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              maximumLevel: 19,
              credit: '© OpenStreetMap contributors',
            }),
          ),
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
        });
        viewer.scene.globe.enableLighting = false;
        viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(77.07, 28.47, 16000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
        });
        viewerRef.current = viewer;
        setReady(true);
      } catch (err) {
        console.warn('Cesium failed to boot, using 2D fallback', err);
        setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      try {
        viewerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      viewerRef.current = null;
    };
  }, []);

  // (re)build entities when hazards or readiness change
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || !ready) return;

    for (const e of entitiesRef.current.values()) viewer.entities.remove(e);
    entitiesRef.current.clear();

    for (const h of hazards) {
      const color = Cesium.Color.fromCssColorString(SEVERITY_META[h.severity].hex);
      const ent = viewer.entities.add({
        id: h.id,
        position: Cesium.Cartesian3.fromDegrees(h.longitude, h.latitude, 30),
        point: {
          pixelSize: h.severity === 'critical' ? 16 : 12,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label:
          h.severity === 'critical' || h.severity === 'high'
            ? {
                text: h.id,
                font: '600 11px Inter, sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                distanceScale: 0.7,
              }
            : undefined,
      });
      entitiesRef.current.set(h.id, ent);
    }
  }, [hazards, ready]);

  // click picking
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || !ready || !onSelectRef.current) return;
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      const id = picked?.id?.id ?? picked?.id?._id;
      if (typeof id === 'string') {
        const h = hazards.find((x) => x.id === id);
        if (h) onSelectRef.current?.(h);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    return () => handler.destroy();
  }, [hazards, ready]);

  // smooth fly-to focused hazard
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || !ready || !focusHazardId) return;
    const h = hazards.find((x) => x.id === focusHazardId);
    if (!h) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(h.longitude, h.latitude - 0.008, 900),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-40), roll: 0 },
      duration: 1.6,
    });
  }, [focusHazardId, hazards, ready]);

  if (failed) {
    return <Fallback2D hazards={hazards} height={height} onSelect={onSelect} />;
  }

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      <div ref={hostRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-[#0f1720] text-xs font-semibold text-gray-300">
          Initializing 3D scene…
        </div>
      )}
      {!compact && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-black/60 px-3 py-2 text-[10px] font-semibold text-white">
          3D spatial intelligence · CesiumJS · OSM tiles · no API keys
        </div>
      )}
      {!compact && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex gap-2 rounded-lg bg-black/60 px-3 py-2 text-[10px] font-semibold text-white">
          <span>🔴 Critical</span>
          <span style={{ color: SEVERITY_META.high.hex }}>● High</span>
          <span style={{ color: SEVERITY_META.moderate.hex }}>● Moderate</span>
          <span style={{ color: SEVERITY_META.low.hex }}>● Low</span>
        </div>
      )}
    </div>
  );
}
