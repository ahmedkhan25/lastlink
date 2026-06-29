import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import { Icon } from "@lastlink/ui";
import { gql, postApi } from "../lib/api.js";

interface Msg { id: string; type: string; title: string | null; status: string }
interface Tokens { playback: string; thumbnail: string; storyboard: string }

const Q = `query($id: uuid!) { app_messages_by_pk(id: $id) { id type title status } }`;

export function MessageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<Msg | null>(null);
  const [playbackId, setPlaybackId] = useState<string>();
  const [tokens, setTokens] = useState<Tokens>();
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    let active = true;
    gql<{ app_messages_by_pk: Msg | null }>(Q, { id }).then((d) => {
      if (!active) return;
      const m = d.app_messages_by_pk;
      setMsg(m);
      if (m?.type === "video" && m.status === "ready") {
        postApi<{ playbackId: string; tokens: Tokens }>(`/api/messages/${id}/playback-token`)
          .then((t) => { setPlaybackId(t.playbackId); setTokens(t.tokens); })
          .catch(() => setNote("This video is still being prepared — check back in a moment."));
      }
    });
    return () => { active = false; };
  }, [id]);

  return (
    <div style={{ padding: "56px 64px", maxWidth: 900, margin: "0 auto" }}>
      <button className="ll-btn ghost" onClick={() => navigate("/dashboard")} style={{ marginBottom: 20 }}>
        <Icon name="arrowLeft" size={16} /> Back
      </button>

      {!msg && <p style={{ color: "var(--ink-3)" }}>Loading…</p>}

      {msg && (
        <>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {msg.type} · {msg.status === "ready" ? "sealed & ready" : "draft"}
          </div>
          <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.015em", margin: "6px 0 24px" }}>
            {msg.title ?? "Untitled message"}
          </h1>

          {msg.type === "video" && tokens && playbackId && (
            <>
              <div style={{ borderRadius: "var(--r-4)", overflow: "hidden", aspectRatio: "16/9", background: "#241D17" }}>
                <MuxPlayer playbackId={playbackId} tokens={tokens} accentColor="#6B2CB0" style={{ height: "100%", width: "100%" }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 10 }}>
                This is your private preview. After release it plays only for the named recipient, via a signed link.
              </p>
            </>
          )}

          {msg.type === "video" && !tokens && (
            <div style={{ padding: 40, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", textAlign: "center", color: "var(--ink-3)" }}>
              {note || "Preparing your video…"}
            </div>
          )}

          {msg.type === "letter" && (
            <div style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <Icon name="lock" size={20} color="var(--brand-purple)" />
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>This letter is sealed.</div>
                <div style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.55 }}>
                  It's encrypted and will only be unsealed for its recipient after release — never shown again here, by design.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
