import { useRef, useState } from "react";
import MuxUploader from "@mux/mux-uploader-react";
import MuxPlayer from "@mux/mux-player-react";
import { gql, postApi } from "../lib/api.js";

interface Tokens { playback: string; thumbnail: string; storyboard: string }
type Status = "idle" | "uploading" | "processing" | "ready" | "error";

const CREATE = `mutation($title: String, $group_id: uuid) {
  insert_app_messages_one(object: {type: "video", title: $title, group_id: $group_id, status: "draft"}) { id }
}`;

export function VideoComposer({ title, groupId }: { title: string; groupId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [playbackId, setPlaybackId] = useState<string>();
  const [tokens, setTokens] = useState<Tokens>();
  const idRef = useRef<string | null>(null);

  // MuxUploader calls this to obtain the direct-upload URL; we lazily create
  // the message + Mux upload here and remember the id for polling.
  async function getUploadUrl(): Promise<string> {
    let id = idRef.current;
    if (!id) {
      const c = await gql<{ insert_app_messages_one: { id: string } }>(CREATE, { title, group_id: groupId || null });
      id = c.insert_app_messages_one.id;
      idRef.current = id;
    }
    const { uploadUrl } = await postApi<{ uploadUrl: string }>(`/api/messages/${id}/upload-init`);
    return uploadUrl;
  }

  async function onSuccess() {
    setStatus("processing");
    const id = idRef.current!;
    for (let i = 0; i < 24; i++) {
      const r = await postApi<{ status: string }>(`/api/messages/${id}/media/refresh`);
      if (r.status === "ready") {
        const t = await postApi<{ playbackId: string; tokens: Tokens }>(`/api/messages/${id}/playback-token`);
        setPlaybackId(t.playbackId);
        setTokens(t.tokens);
        setStatus("ready");
        return;
      }
      if (r.status === "errored") { setStatus("error"); return; }
      await new Promise((res) => setTimeout(res, 4000));
    }
    setStatus("error");
  }

  if (status === "ready" && playbackId && tokens) {
    return (
      <div>
        <div style={{ borderRadius: "var(--r-4)", overflow: "hidden", aspectRatio: "16/9", background: "#241D17" }}>
          <MuxPlayer
            playbackId={playbackId}
            tokens={{ playback: tokens.playback, thumbnail: tokens.thumbnail, storyboard: tokens.storyboard }}
            accentColor="#6B2CB0"
            style={{ height: "100%", width: "100%" }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>Ready · sealed · plays only with a signed token</div>
      </div>
    );
  }

  return (
    <div>
      <MuxUploader endpoint={getUploadUrl} onSuccess={onSuccess} onUploadStart={() => setStatus("uploading")} style={{ ["--uploader-font-family" as string]: "var(--font-sans)" }} />
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 12 }}>
        {status === "uploading" && "Uploading…"}
        {status === "processing" && "Mux is processing your video (captions + renditions)… this takes a moment."}
        {status === "error" && <span style={{ color: "var(--err)" }}>Something went wrong. Try again.</span>}
        {status === "idle" && "Drop a video (or pick a file). It uploads resumably and is stored encrypted by Mux."}
      </div>
    </div>
  );
}
