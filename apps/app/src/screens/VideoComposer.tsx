import { useEffect, useRef, useState } from "react";
import MuxUploader from "@mux/mux-uploader-react";
import MuxPlayer from "@mux/mux-player-react";
import * as UpChunk from "@mux/upchunk";
import { Icon } from "@lastlink/ui";
import { gql, postApi } from "../lib/api.js";
import { VideoRecorder } from "./VideoRecorder.js";

interface Tokens { playback: string; thumbnail: string; storyboard: string }
type Mode = "choose" | "record" | "upload";
type Status = "idle" | "uploading" | "processing" | "ready" | "error";

const CREATE = `mutation($title: String, $group_id: uuid) {
  insert_app_messages_one(object: {type: "video", title: $title, group_id: $group_id, status: "draft"}) { id }
}`;

export function VideoComposer({ title, groupId, onSaved, onDirtyChange }: { title: string; groupId: string; onSaved?: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("choose");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [playbackId, setPlaybackId] = useState<string>();
  const [tokens, setTokens] = useState<Tokens>();
  const [errorMsg, setErrorMsg] = useState("");
  const [hasClip, setHasClip] = useState(false); // recorded but not yet uploaded
  const idRef = useRef<string | null>(null);
  const processingRef = useRef(false); // guard so reconciliation only starts once

  // "Dirty" = a recording exists that hasn't been persisted, or one is in flight.
  // The parent uses this to stop the user advancing past an unsaved video.
  useEffect(() => {
    onDirtyChange?.(hasClip || status === "uploading" || status === "processing");
  }, [hasClip, status, onDirtyChange]);

  async function ensureUploadUrl(): Promise<string> {
    let id = idRef.current;
    if (!id) {
      const c = await gql<{ insert_app_messages_one: { id: string } }>(CREATE, { title, group_id: groupId || null });
      id = c.insert_app_messages_one.id;
      idRef.current = id;
      onSaved?.(); // the message row now exists — it will show on the dashboard even while Mux processes
    }
    const { uploadUrl } = await postApi<{ uploadUrl: string }>(`/api/messages/${id}/upload-init`);
    return uploadUrl;
  }

  async function startProcessing() {
    if (processingRef.current) return; // already reconciling — don't double-poll
    processingRef.current = true;
    setStatus("processing");
    const id = idRef.current!;
    for (let i = 0; i < 30; i++) {
      try {
        const r = await postApi<{ status: string }>(`/api/messages/${id}/media/refresh`);
        if (r.status === "ready") {
          const t = await postApi<{ playbackId: string; tokens: Tokens }>(`/api/messages/${id}/playback-token`);
          setPlaybackId(t.playbackId);
          setTokens(t.tokens);
          setStatus("ready");
          return;
        }
        if (r.status === "errored") return setStatus("error");
      } catch (e) {
        // A transient refresh error must NOT abort the loop — the message row
        // already exists and Mux keeps processing server-side. Keep polling; the
        // message page also reconciles on open, so state can't get permanently stuck.
        console.warn("[lastlink] media refresh retry", e);
      }
      await new Promise((res) => setTimeout(res, 4000));
    }
    // The video is saved and processing; it just took longer than we waited here.
    setStatus("processing");
    setErrorMsg("Still processing — it will appear on your dashboard shortly.");
  }

  async function uploadRecorded(blob: Blob) {
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");
    if (!blob || blob.size === 0) {
      setErrorMsg("The recording was empty (0 bytes).");
      setStatus("error");
      return;
    }
    try {
      const endpoint = await ensureUploadUrl();
      // UpChunk requires a File (not a bare Blob) — wrap the recording.
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const file = blob instanceof File ? blob : new File([blob], `recording.${ext}`, { type: blob.type || "video/webm" });
      const up = UpChunk.createUpload({ endpoint, file });
      up.on("progress", (e) => {
        const pct = Math.round((e as CustomEvent<number>).detail);
        setProgress(pct);
        if (pct >= 100) startProcessing(); // begin reconciling as soon as bytes are in
      });
      up.on("success", () => startProcessing());
      up.on("error", (e) => {
        const d = (e as CustomEvent).detail as { message?: string } | string | undefined;
        const msg = typeof d === "string" ? d : (d?.message ?? JSON.stringify(d));
        console.error("[lastlink] upload error", d);
        setErrorMsg(`Upload: ${msg}`);
        setStatus("error");
      });
      // Safety net: UpChunk's success/progress events can be missed (the upload
      // still reaches Mux). Poll media/refresh regardless — it returns 'waiting'
      // until the bytes land, then syncs. This prevents a permanent "0%" freeze.
      setTimeout(() => { if (!processingRef.current) startProcessing(); }, 8000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[lastlink] upload init failed", e);
      setErrorMsg(`Init: ${msg}`);
      setStatus("error");
    }
  }

  if (status === "ready" && playbackId && tokens) {
    return (
      <div>
        <div style={{ borderRadius: "var(--r-4)", overflow: "hidden", aspectRatio: "16/9", background: "#241D17" }}>
          <MuxPlayer playbackId={playbackId} tokens={tokens} accentColor="#6B2CB0" style={{ height: "100%", width: "100%" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
          <span>Ready · sealed · plays only with a signed token</span>
          <button className="ll-btn ghost" onClick={() => { idRef.current = null; processingRef.current = false; setStatus("idle"); setMode("choose"); }}>Record another</button>
        </div>
      </div>
    );
  }

  if (status === "uploading" || status === "processing") {
    return (
      <div style={{ padding: 40, border: "1px solid var(--line)", borderRadius: "var(--r-3)", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
          {status === "uploading" ? `Uploading securely to LastLink… ${progress}%` : "Preparing your video"}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
          {status === "uploading" ? "Your recording is being saved, encrypted." : "Securing your message and generating captions… just a moment."}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--line)", marginTop: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: status === "uploading" ? `${progress}%` : "100%", background: "var(--brand-grad)", transition: "width 200ms" }} />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ padding: 40, border: "1px solid var(--line)", borderRadius: "var(--r-3)", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--err)", marginBottom: 8 }}>That didn't save. Let's try again.</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 8 }}>Your recording wasn't saved — nothing was lost on our end.</div>
        {errorMsg && <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 16, wordBreak: "break-word" }}>{errorMsg}</div>}
        <button className="ll-btn" onClick={() => { idRef.current = null; processingRef.current = false; setProgress(0); setStatus("idle"); setMode("choose"); }}>Try again</button>
      </div>
    );
  }

  if (mode === "record") return <VideoRecorder onRecorded={uploadRecorded} onCancel={() => { setHasClip(false); setMode("choose"); }} onClipChange={setHasClip} />;

  if (mode === "upload") {
    return (
      <div>
        <MuxUploader endpoint={ensureUploadUrl} onSuccess={() => startProcessing()} onUploadStart={() => setStatus("uploading")} />
        <button className="ll-btn ghost" onClick={() => setMode("choose")} style={{ marginTop: 10 }}>← Back</button>
      </div>
    );
  }

  // choose
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Choice icon="video" title="Record a video" sub="Use your camera, right here" onClick={() => setMode("record")} primary />
      <Choice icon="arrow" title="Upload a file" sub="Drag in an existing recording" onClick={() => setMode("upload")} />
    </div>
  );
}

function Choice({ icon, title, sub, onClick, primary }: { icon: "video" | "arrow"; title: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ textAlign: "left", padding: 24, border: "1px solid var(--line)", borderRadius: "var(--r-3)", background: primary ? "var(--brand-grad-soft)" : "var(--surface)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
      <Icon name={icon} size={24} color="var(--brand-purple)" />
      <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{sub}</div>
    </button>
  );
}
