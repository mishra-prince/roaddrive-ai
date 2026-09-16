import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Real camera access for the LIVE DRIVE screen (rear camera preferred).
 * Falls back to the animated road simulation when:
 *  - the browser has no getUserMedia (http on non-localhost, old browser)
 *  - the user denies permission
 *  - no camera device exists
 * The UI always labels which source is active — never fakes a real feed.
 *
 * The stream is attached in an effect (not inside start()) so the <video>
 * element can mount after permission resolves without losing the stream.
 */

export type CameraState = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('idle');
  const [errName, setErrName] = useState<string>('');

  // Attach the stream whenever a video element exists and we hold a stream —
  // covers both orders: element mounted before/after permission resolves.
  useEffect(() => {
    if (state !== 'live') return;
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [state, videoRef, streamRef]);

  // Keep playing if the browser pauses the element (e.g. after re-render)
  useEffect(() => {
    if (state !== 'live') return;
    const v = videoRef.current;
    if (!v) return;
    const onStalled = () => v.play().catch(() => {});
    v.addEventListener('pause', onStalled);
    return () => v.removeEventListener('pause', onStalled);
  }, [state]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) {
      // already have a stream (e.g. re-mounted) — just re-attach
      setState('live');
      return true;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      return false;
    }
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setState('live');
      return true;
    } catch (err: any) {
      setState(err?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
      return false;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, state, start, stop };
}
