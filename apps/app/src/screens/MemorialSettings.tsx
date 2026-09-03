import { useCallback, useEffect, useState } from "react";
import { Icon } from "@lastlink/ui";
import { gql, getMemorialUrl, postIdempotent } from "../lib/api.js";
import { useUploadThing } from "../lib/uploadthing.js";
import { MemorialHead, MemorialTabs, FieldLabel, card, field, page } from "./memorial/shared.js";

interface Memorial {
  id: string;
  slug: string;
  status: "draft" | "published" | "hidden";
  visibility: "unlisted" | "public";
  headline: string | null;
  location: string | null;
  birth_year: number | null;
  death_year: number | null;
  quote: string | null;
  story: string | null;
  service_when: string | null;
  service_details: string | null;
}
interface Media { id: string; url: string; file_key: string | null; caption: string | null; alt_text: string | null; sort_order: number }
interface Message { id: string; title: string | null; type: string; status: string; visible_on_memorial: boolean }
interface Data { app_memorials: Memorial[]; app_memorial_media: Media[]; app_messages: Message[] }

const QUERY = `query MemorialSettings {
  app_memorials(limit: 1) { id slug status visibility headline location birth_year death_year quote story service_when service_details }
  app_memorial_media(order_by: {sort_order: asc}) { id url file_key caption alt_text sort_order }
  app_messages(where: {status: {_in: ["ready", "released"]}}, order_by: {created_at: asc}) { id title type status visible_on_memorial }
}`;
const UPDATE = `mutation UpdateMemorial($id: uuid!, $set: app_memorials_set_input!) {
  update_app_memorials_by_pk(pk_columns: {id: $id}, _set: $set) { id }
}`;
const INSERT_MEDIA = `mutation AddMemorialMedia($memorialId: uuid!, $url: String!, $key: String, $sort: Int!) {
  insert_app_memorial_media_one(object: {memorial_id: $memorialId, url: $url, file_key: $key, sort_order: $sort}) { id }
}`;
const DELETE_MEDIA = `mutation DeleteMemorialMedia($id: uuid!) { delete_app_memorial_media_by_pk(id: $id) { id } }`;
const UPDATE_MEDIA = `mutation UpdateMemorialMedia($id: uuid!, $caption: String, $alt: String) {
  update_app_memorial_media_by_pk(pk_columns: {id: $id}, _set: {caption: $caption, alt_text: $alt}) { id }
}`;

export function MemorialSettings() {
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState<Partial<Memorial>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const load = useCallback(async () => {
    const next = await gql<Data>(QUERY);
    setData(next);
    setForm(next.app_memorials[0] ?? {});
  }, []);
  useEffect(() => { load().catch((err) => setNote(String(err))); }, [load]);

  const { startUpload, isUploading } = useUploadThing("memorialGalleryPhoto", {
    onClientUploadComplete: async (files: Array<{ key?: string; ufsUrl?: string; serverData?: { url?: string; key?: string } }>) => {
      const memorial = data?.app_memorials[0];
      if (!memorial) return;
      for (const [offset, file] of files.entries()) {
        const url = file.serverData?.url ?? file.ufsUrl;
        if (!url) continue;
        await gql(INSERT_MEDIA, { memorialId: memorial.id, url, key: file.serverData?.key ?? file.key ?? null, sort: data.app_memorial_media.length + offset });
      }
      await load();
      setNote("Gallery updated.");
    },
    onUploadError: (err: Error) => setNote(err.message),
  });

  const memorial = data?.app_memorials[0];
  const publicUrl = memorial ? `${getMemorialUrl()}/${memorial.slug}` : "";
  function set<K extends keyof Memorial>(key: K, value: Memorial[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function save() {
    if (!memorial) return;
    setBusy(true); setNote(null);
    try {
      const { id: _id, slug: _slug, status: _status, ...editable } = form;
      await gql(UPDATE, { id: memorial.id, set: editable });
      await load(); setNote("Memorial saved.");
    } catch (err) { setNote(String(err)); } finally { setBusy(false); }
  }

  async function changeStatus(action: "publish" | "hide") {
    setBusy(true); setNote(null);
    try {
      await postIdempotent(`/api/memorial/${action}-demo`);
      await load(); setNote(action === "publish" ? "Memorial published for the demo." : "Memorial hidden.");
    } catch (err) { setNote(String(err)); } finally { setBusy(false); }
  }

  if (!data) return <div style={page}>Loading memorial…</div>;
  if (!memorial) return <div style={page}>No memorial record exists. Apply the memorial schema and try again.</div>;

  return (
    <div style={page}>
      <MemorialHead title="Memorial page" sub="Shape the public remembrance page used in investor demos. Each test account has its own page."
        action={<Status status={memorial.status} />} />
      <MemorialTabs />

      <section style={{ ...card, padding: 22, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div><FieldLabel>Public address</FieldLabel><div className="serif" style={{ fontSize: 20 }}>{publicUrl}</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ll-btn secondary" onClick={() => navigator.clipboard.writeText(publicUrl)}>Copy link</button>
            {memorial.status === "published" && <a className="ll-btn secondary" href={publicUrl} target="_blank" rel="noreferrer">Open page <Icon name="arrow" size={15} /></a>}
          </div>
        </div>
      </section>

      <section style={{ ...card, padding: 24, marginTop: 16 }}>
        <div style={grid}>
          <TextInput label="Headline" value={form.headline} onChange={(v) => set("headline", v)} wide />
          <TextInput label="Location" value={form.location} onChange={(v) => set("location", v)} />
          <TextInput label="Birth year" value={form.birth_year?.toString()} onChange={(v) => set("birth_year", v ? Number(v) : null)} />
          <TextInput label="Passing year" value={form.death_year?.toString()} onChange={(v) => set("death_year", v ? Number(v) : null)} />
          <TextInput label="Favorite quote" value={form.quote} onChange={(v) => set("quote", v)} wide />
          <TextArea label="Life story" value={form.story} onChange={(v) => set("story", v)} />
          <TextInput label="Service date and time" value={form.service_when} onChange={(v) => set("service_when", v)} wide />
          <TextArea label="Service details and wishes" value={form.service_details} onChange={(v) => set("service_details", v)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}><button className="ll-btn grad" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save memorial"}</button></div>
      </section>

      <Gallery media={data.app_memorial_media} uploading={isUploading} onUpload={(files) => startUpload(Array.from(files))} onRefresh={load} />
      <Messages messages={data.app_messages} onRefresh={load} />

      <section style={{ ...card, padding: 22, marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div><div className="serif" style={{ fontSize: 21 }}>Demo publishing</div><div style={{ color: "var(--ink-3)", fontSize: 13 }}>Manual for investor demos; not connected to the death-release workflow.</div></div>
        <button className={memorial.status === "published" ? "ll-btn secondary" : "ll-btn grad"} disabled={busy}
          onClick={() => changeStatus(memorial.status === "published" ? "hide" : "publish")}>{memorial.status === "published" ? "Hide memorial" : "Publish memorial"}</button>
      </section>
      {note && <p style={{ color: note.includes("Error") ? "var(--err)" : "var(--ink-2)", fontSize: 13 }}>{note}</p>}
    </div>
  );
}

function Gallery({ media, uploading, onUpload, onRefresh }: { media: Media[]; uploading: boolean; onUpload: (files: FileList) => void; onRefresh: () => Promise<void> }) {
  async function remove(id: string) { await gql(DELETE_MEDIA, { id }); await onRefresh(); }
  async function update(item: Media, caption: string) { await gql(UPDATE_MEDIA, { id: item.id, caption, alt: caption }); await onRefresh(); }
  return <section style={{ ...card, padding: 24, marginTop: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div><div className="serif" style={{ fontSize: 24 }}>Photo gallery</div><div style={{ color: "var(--ink-3)", fontSize: 13 }}>Add warm, personal images to the public page.</div></div>
      <label className="ll-btn secondary">{uploading ? "Uploading…" : "Add photos"}<input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => e.target.files && onUpload(e.target.files)} /></label></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginTop: 18 }}>
      {media.map((item) => <div key={item.id} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-2)", overflow: "hidden" }}><img src={item.url} alt={item.alt_text ?? item.caption ?? "Memorial gallery"} style={{ width: "100%", height: 130, objectFit: "cover" }} /><div style={{ padding: 10 }}><input defaultValue={item.caption ?? ""} placeholder="Add a caption" style={{ ...field, padding: "7px 9px", fontSize: 12 }} onBlur={(e) => update(item, e.target.value)} /><button onClick={() => remove(item.id)} style={linkButton}>Remove</button></div></div>)}
      {!media.length && <div style={{ color: "var(--ink-3)", fontSize: 13 }}>No gallery images yet.</div>}
    </div>
  </section>;
}

function Messages({ messages, onRefresh }: { messages: Message[]; onRefresh: () => Promise<void> }) {
  async function toggle(message: Message) {
    await postIdempotent("/api/memorial/message-visibility", {
      messageId: message.id,
      visible: !message.visible_on_memorial,
    });
    await onRefresh();
  }
  return <section style={{ ...card, padding: 24, marginTop: 16 }}><div className="serif" style={{ fontSize: 24 }}>Shared with everyone</div><p style={{ color: "var(--ink-3)", fontSize: 13 }}>Choose message cards to show publicly. Playback remains private in this demo increment.</p>{messages.map((message) => <label key={message.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--line-soft)" }}><input type="checkbox" checked={message.visible_on_memorial} onChange={() => toggle(message)} /><span style={{ flex: 1 }}>{message.title || `Untitled ${message.type}`}</span><span className="mono" style={{ color: "var(--ink-3)", fontSize: 10 }}>{message.type.toUpperCase()}</span></label>)}{!messages.length && <div style={{ color: "var(--ink-3)", fontSize: 13 }}>No ready messages yet.</div>}</section>;
}

function TextInput({ label, value, onChange, wide }: { label: string; value?: string | null; onChange: (value: string) => void; wide?: boolean }) { return <label style={{ gridColumn: wide ? "1 / -1" : undefined }}><FieldLabel>{label}</FieldLabel><input style={field} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value?: string | null; onChange: (value: string) => void }) { return <label style={{ gridColumn: "1 / -1" }}><FieldLabel>{label}</FieldLabel><textarea style={{ ...field, minHeight: 110, resize: "vertical" }} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></label>; }
function Status({ status }: { status: Memorial["status"] }) { return <span className="mono" style={{ padding: "6px 11px", borderRadius: "var(--r-pill)", background: status === "published" ? "rgba(47,122,85,.12)" : "var(--brand-grad-soft)", color: status === "published" ? "var(--ok)" : "var(--brand-purple)", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>{status}</span>; }

const grid = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 } as const;
const linkButton = { border: 0, background: "none", color: "var(--err)", padding: "8px 0 0", fontSize: 12 } as const;
