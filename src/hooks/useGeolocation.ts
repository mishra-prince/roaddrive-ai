import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser geolocation with a graceful fallback: if the user denies access or
 * the API is unavailable, we fall back to the demo area centre and mark the
 * fix as simulated so the UI never lies about the position source.
 */

export interface GeoFix {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'device' | 'fallback';
  at: number;
}

const FALLBACK: GeoFix = { lat: 28.4765, lng: 77.0765, source: 'fallback', at: Date.now() };

export function useGeolocation(auto = true) {
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [status, setStatus] = useState<'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable'>('idle');
  const watchRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setFix(FALLBACK);
      return;
    }
    setStatus('prompt');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('granted');
        setFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: 'device', at: pos.timestamp });
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setFix(FALLBACK);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
    );
    // keep the marker live while driving
    if (watchRef.current === null) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => setFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: 'device', at: pos.timestamp }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 },
      );
    }
  }, []);

  useEffect(() => {
    if (auto) start();
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [auto, start]);

  return { fix, status, start };
}
