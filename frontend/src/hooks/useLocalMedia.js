import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Manages a single local MediaStream (mic/cam) and optional screen share.
 * No signaling here — just local preview and control wiring.
 */
export default function useLocalMedia() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [muted, setMuted] = useState(true);
  const [cameraOff, setCameraOff] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const screenTrackRef = useRef(null);

  // init audio+video on first use (lazy)
  const ensureStream = useCallback(async () => {
    if (stream) return stream;
    const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    // start muted/camera off by default (like Meet waiting state)
    s.getAudioTracks().forEach(t => (t.enabled = false));
    s.getVideoTracks().forEach(t => (t.enabled = false));
    setStream(s);
    return s;
  }, [stream]);

  // attach to <video>
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  const toggleMute = useCallback(async () => {
    const s = await ensureStream();
    const enabled = s.getAudioTracks().some(t => t.enabled);
    s.getAudioTracks().forEach(t => (t.enabled = !enabled));
    setMuted(enabled);
  }, [ensureStream]);

  const toggleCamera = useCallback(async () => {
    const s = await ensureStream();
    const enabled = s.getVideoTracks().some(t => t.enabled);
    s.getVideoTracks().forEach(t => (t.enabled = !enabled));
    setCameraOff(enabled);
  }, [ensureStream]);

  const togglePresent = useCallback(async () => {
    if (!presenting) {
      try {
        const ds = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const track = ds.getVideoTracks()[0];
        screenTrackRef.current = track;
        setPresenting(true);
        track.onended = () => {
          setPresenting(false);
          screenTrackRef.current = null;
        };
        // For local preview: swap into the <video> temporarily
        const s = new MediaStream([track]);
        setStream(s);
      } catch {
        /* user cancelled */
      }
    } else if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setPresenting(false);
      // restore original cam stream but keep previous on/off state
      const s = await ensureStream();
      setStream(s);
    }
  }, [ensureStream, presenting]);

  const stopAll = useCallback(() => {
    if (screenTrackRef.current) {
      try { screenTrackRef.current.stop(); } catch {}
      screenTrackRef.current = null;
    }
    setPresenting(false);
    setMuted(true);
    setCameraOff(true);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  return {
    videoRef,
    muted, cameraOff, presenting,
    ensureStream,
    toggleMute, toggleCamera, togglePresent, stopAll,
  };
}
