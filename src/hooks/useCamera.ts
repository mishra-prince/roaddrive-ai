import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Real camera access for the LIVE DRIVE screen (rear camera preferred).
 * Falls back to the animated road simulation when:
 *  - the browser has no getUserMedia (http on non-localhost, old browser)
 *  - the user denies permission
 *  - no camera device exists
 * The UI always labels which source is active — never fakes a real feed.
 */

export type CameraState = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('idle');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return true;
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
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
