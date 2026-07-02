import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@lastlink/ui";

// Cross-browser recording mime. Prefer WebM (reliable on Chrome/Firefox);
// fall back to MP4/H.264 which is what Safari/iOS records. Chrome's MP4
// recording is flaky and can produce unplayable blobs, so WebM goes first.
function pickMimeType(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];
  const supported = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported;
  return supported ? candidates.find((c) => MediaRecorder.isTypeSupported(c)) : undefined;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function VideoRecorder({ onRecorded, onCancel, onClipChange }: { onRecorded: (blob: Blob) => void; onCancel: () => void; onClipChange?: (present: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      // 'ideal' (not exact) so cameras that can't do 720p still start instead of failing.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Camera/microphone access was denied. Check browser permissions.");
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  function start() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onerror = () => { setError("Recording failed on this device. Try a different browser (Chrome or Safari)."); stopCamera(); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
      stopCamera(); // turn the camera off so it's clearly the recording, not a live feed
      // A 0-byte capture means the codec/hardware produced nothing — never hand
      // that upstream (it would be silently dropped). Force a clean retry.
      if (blob.size === 0) {
        setError("That recording came through empty (0 bytes). Please record again — this is usually a one-off browser hiccup.");
        onClipChange?.(false);
        return;
      }
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      onClipChange?.(true); // a saved-worthy clip now exists but isn't uploaded yet
    };
    rec.start(1000); // emit a chunk per second so data is captured reliably
    recorderRef.current = rec;
    setElapsed(0);
    setRecording(true);
  }

  function stop() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.requestData(); } catch { /* flush best-effort */ } // force a final chunk before stopping
      rec.stop();
    }
    setRecording(false);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setElapsed(0);
    onClipChange?.(false);
    startCamera(); // re-acquire the camera for another take
  }

  if (error) {
    return (
      <div style={{ padding: 32, border: "1px solid var(--line)", borderRadius: "var(--r-3)", textAlign: "center" }}>
        <div style={{ color: "var(--err)", marginBottom: 12 }}>{error}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="ll-btn grad" onClick={() => { setError(null); reset(); }}>Record again</button>
          <button className="ll-btn secondary" onClick={onCancel}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", borderRadius: "var(--r-4)", overflow: "hidden", aspectRatio: "16/9", background: "#241D17" }}>
        {previewUrl ? (
          // key forces a fresh <video> node — otherwise React reuses the live
          // element, whose srcObject (stopped stream) would override src → black.
          <video key="preview" src={previewUrl} controls autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video key="live" ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        )}
        {recording && (
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.5)", color: "white", padding: "5px 12px", borderRadius: 999, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#9A3A2E" }} /> {fmt(elapsed)}
          </div>
        )}
        {previewUrl && (
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.5)", color: "white", padding: "5px 12px", borderRadius: 999, fontSize: 13 }}>
            <Icon name="play" size={12} color="white" /> Your recording
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
        {!previewUrl && !recording && (
          <button className="ll-btn grad" onClick={start}><Icon name="video" size={16} color="white" /> Start recording</button>
        )}
        {recording && (
          <button className="ll-btn" onClick={stop} style={{ background: "var(--err)" }}>Stop recording</button>
        )}
        {previewUrl && (
          <>
            <button className="ll-btn grad" onClick={() => { if (recordedBlob) { onClipChange?.(false); onRecorded(recordedBlob); } }}>Use this video</button>
            <button className="ll-btn secondary" onClick={reset}>Re-record</button>
          </>
        )}
        <button className="ll-btn ghost" onClick={onCancel}>Cancel</button>
        <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: "auto" }}>
          {recordedBlob ? `Recorded ${(recordedBlob.size / 1024 / 1024).toFixed(2)} MB` : "No time limit. Take your time."}
        </span>
      </div>
    </div>
  );
}
