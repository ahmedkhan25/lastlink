import type { Request, Response } from "express";
import {
  createCondolenceSchema,
  type PublicMemorialPayload,
  type PublicMemorialSummary,
} from "@lastlink/shared";
import { query } from "./db.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";
import { env } from "./env.js";
import { mintPlaybackTokens } from "./video.js";

interface MemorialRow {
  id: string;
  slug: string;
  display_name: string;
  portrait_url: string | null;
  headline: string | null;
  location: string | null;
  birth_year: number | null;
  death_year: number | null;
  quote: string | null;
  story: string | null;
  service_when: string | null;
  service_details: string | null;
}

function idempotencyKey(req: Request): string | null {
  const key = req.header("idempotency-key")?.trim();
  return key && key.length <= 200 ? key : null;
}

export async function browsePublicMemorials(req: Request, res: Response): Promise<void> {
  const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  const { rows } = await query<{
    slug: string;
    display_name: string;
    portrait_url: string | null;
    cover_image_url: string | null;
    headline: string | null;
    location: string | null;
    birth_year: number | null;
    death_year: number | null;
  }>(
    `select m.slug, r.legal_name as display_name, r.avatar_url as portrait_url,
            cover.url as cover_image_url, m.headline, m.location, m.birth_year, m.death_year
       from app.memorials m
       join app.registrants r on r.id = m.registrant_id
       left join lateral (
         select mm.url from app.memorial_media mm
          where mm.memorial_id = m.id order by mm.sort_order, mm.created_at limit 1
       ) cover on true
      where m.status = 'published' and m.visibility = 'public'
        and ($1 = '' or concat_ws(' ', r.legal_name, m.headline, m.location,
              m.birth_year::text, m.death_year::text) ilike '%' || $1 || '%')
      order by coalesce(m.published_at, m.created_at) desc, r.legal_name
      limit 24`,
    [search],
  );
  const memorials: PublicMemorialSummary[] = rows.map((item) => ({
    slug: item.slug,
    displayName: item.display_name,
    portraitUrl: item.portrait_url,
    coverImageUrl: item.cover_image_url,
    headline: item.headline,
    location: item.location,
    birthYear: item.birth_year,
    deathYear: item.death_year,
  }));
  res.json({ memorials, query: search });
}

export async function getPublicMemorial(req: Request, res: Response): Promise<void> {
  const { rows } = await query<MemorialRow>(
    `select m.id, m.slug, r.legal_name as display_name, r.avatar_url as portrait_url,
            m.headline, m.location, m.birth_year, m.death_year, m.quote, m.story,
            m.service_when, m.service_details
       from app.memorials m
       join app.registrants r on r.id = m.registrant_id
      where m.slug = $1 and m.status = 'published'`,
    [String(req.params.slug).toLowerCase()],
  );
  const memorial = rows[0];
  if (!memorial) return void res.status(404).json({ error: "Memorial not found" });

  const [gallery, condolences, messages, offerings] = await Promise.all([
    query<{ id: string; url: string; caption: string | null; alt_text: string | null }>(
      `select id, url, caption, alt_text from app.memorial_media
        where memorial_id = $1 order by sort_order, created_at`, [memorial.id]),
    query<{ id: string; author_name: string; relationship: string | null; body: string; image_url: string | null; created_at: string }>(
      `select id, author_name, relationship, body, image_url, created_at
         from app.condolences where memorial_id = $1 and status = 'approved'
        order by created_at desc`, [memorial.id]),
    query<{ id: string; type: "video" | "audio" | "letter"; title: string | null; duration_seconds: number | null; thumbnail_ref: string | null }>(
      `select msg.id, msg.type, msg.title, ma.duration_seconds, ma.thumbnail_ref
         from app.messages msg
         left join app.media_assets ma on ma.id = msg.media_asset_id
         join app.memorials m on m.registrant_id = msg.registrant_id
        where m.id = $1 and msg.visible_on_memorial = true
          and msg.audience_type = 'public' and msg.status in ('ready','released')
        order by msg.created_at`, [memorial.id]),
    query<{ id: string; kind: "flowers" | "donation" | "memorial"; title: string; description: string | null; provider_name: string | null; image_url: string | null; price_label: string | null; cta_label: string | null; sponsor_label: string | null }>(
      `select o.id, o.kind, o.title, o.description, p.name as provider_name,
              o.image_url, o.price_label, o.cta_label, o.sponsor_label
         from app.offerings o left join app.partners p on p.id = o.partner_id
        where o.active = true order by o.sort_order, o.title`),
  ]);

  const payload: PublicMemorialPayload = {
    memorial: {
      slug: memorial.slug,
      displayName: memorial.display_name,
      portraitUrl: memorial.portrait_url,
      headline: memorial.headline,
      location: memorial.location,
      birthYear: memorial.birth_year,
      deathYear: memorial.death_year,
      quote: memorial.quote,
      story: memorial.story,
      serviceWhen: memorial.service_when,
      serviceDetails: memorial.service_details,
    },
    gallery: gallery.rows.map((item) => ({
      id: item.id,
      url: item.url,
      caption: item.caption,
      altText: item.alt_text,
    })),
    condolences: condolences.rows.map((item) => ({
      id: item.id,
      authorName: item.author_name,
      relationship: item.relationship,
      body: item.body,
      imageUrl: item.image_url,
      createdAt: item.created_at,
    })),
    publicMessages: messages.rows.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      durationSeconds: item.duration_seconds,
      thumbnailUrl: item.thumbnail_ref,
    })),
    offerings: offerings.rows.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      providerName: item.provider_name,
      imageUrl: item.image_url,
      priceLabel: item.price_label,
      ctaLabel: item.cta_label ?? "Learn more",
      sponsorLabel: item.sponsor_label,
    })),
  };
  res.json(payload);
}

/** Mint short-lived playback tokens only for a video explicitly shared on a published memorial. */
export async function getPublicMemorialPlayback(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.slug).toLowerCase();
  const messageId = String(req.params.messageId);
  const { rows } = await query<{ mux_playback_id: string }>(
    `select ma.mux_playback_id
       from app.messages msg
       join app.media_assets ma on ma.id = msg.media_asset_id
       join app.memorials m on m.registrant_id = msg.registrant_id
      where m.slug = $1 and m.status = 'published'
        and msg.id = $2 and msg.type = 'video'
        and msg.visible_on_memorial = true and msg.audience_type = 'public'
        and msg.status in ('ready','released')
        and ma.status = 'ready' and ma.mux_playback_id is not null`,
    [slug, messageId],
  );
  const media = rows[0];
  if (!media) return void res.status(404).json({ error: "Public video not found" });

  const tokens = await mintPlaybackTokens(media.mux_playback_id);
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ playbackId: media.mux_playback_id, tokens });
}

export async function createCondolence(req: Request, res: Response): Promise<void> {
  const key = idempotencyKey(req);
  if (!key) return void res.status(400).json({ error: "Missing Idempotency-Key" });
  const parsed = createCondolenceSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid submission" });

  const memorial = await query<{ id: string }>(
    "select id from app.memorials where slug = $1 and status = 'published'",
    [String(req.params.slug).toLowerCase()],
  );
  if (!memorial.rows[0]) return void res.status(404).json({ error: "Memorial not found" });
  const input = parsed.data;
  const inserted = await query<{ id: string }>(
    `insert into app.condolences
       (memorial_id, author_name, author_email, relationship, body, image_url, image_key, status, idempotency_key)
     values ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
     on conflict (memorial_id, idempotency_key) where idempotency_key is not null do nothing
     returning id`,
    [memorial.rows[0].id, input.authorName, input.authorEmail || null, input.relationship || null,
      input.body, input.imageUrl || null, input.imageKey || null, key],
  );
  res.status(inserted.rows[0] ? 201 : 200).json({ ok: true, status: "pending" });
}

async function setDemoMemorialStatus(req: Request, res: Response, status: "published" | "hidden"): Promise<void> {
  if (!env.DEMO_MEMORIAL) return void res.status(404).json({ error: "not found" });
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const key = idempotencyKey(req);
  if (!key) return void res.status(400).json({ error: "Missing Idempotency-Key" });
  const existing = await query<{ action: string }>(
    "select action from audit.event_log where actor_id = $1 and request_id = $2 limit 1",
    [who.userId, key],
  );
  if (existing.rows[0]) return void res.json({ ok: true, status });

  const updated = await query<{ id: string; slug: string }>(
    `update app.memorials set status = $1,
            published_at = case when $1 = 'published' then coalesce(published_at, now()) else published_at end
      where registrant_id = $2 returning id, slug`,
    [status, who.registrantId],
  );
  const memorial = updated.rows[0];
  if (!memorial) return void res.status(404).json({ error: "Memorial not found" });
  await logEvent({
    actorType: "registrant",
    actorId: who.userId,
    action: status === "published" ? "memorial.demo_published" : "memorial.demo_hidden",
    entityType: "memorial",
    entityId: memorial.id,
    requestId: key,
  });
  res.json({ ok: true, status, url: `${env.MEMORIAL_BASE_URL}/${memorial.slug}` });
}

export async function publishDemoMemorial(req: Request, res: Response): Promise<void> {
  return setDemoMemorialStatus(req, res, "published");
}

export async function hideDemoMemorial(req: Request, res: Response): Promise<void> {
  return setDemoMemorialStatus(req, res, "hidden");
}

export async function setMemorialMessageVisibility(req: Request, res: Response): Promise<void> {
  if (!env.DEMO_MEMORIAL) return void res.status(404).json({ error: "not found" });
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const key = idempotencyKey(req);
  if (!key) return void res.status(400).json({ error: "Missing Idempotency-Key" });
  const messageId = typeof req.body?.messageId === "string" ? req.body.messageId : "";
  const visible = req.body?.visible;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId) || typeof visible !== "boolean") {
    return void res.status(400).json({ error: "Invalid message visibility request" });
  }

  const existing = await query(
    "select 1 from audit.event_log where actor_id = $1 and request_id = $2 limit 1",
    [who.userId, key],
  );
  if (existing.rows[0]) return void res.json({ ok: true, visible });

  const updated = await query<{ id: string }>(
    `update app.messages set visible_on_memorial = $1, updated_at = now()
      where id = $2 and registrant_id = $3 and audience_type = 'public'
        and status in ('ready','released')
      returning id`,
    [visible, messageId, who.registrantId],
  );
  if (!updated.rows[0]) return void res.status(404).json({ error: "Ready message not found" });
  await logEvent({
    actorType: "registrant",
    actorId: who.userId,
    action: visible ? "memorial.message_shown" : "memorial.message_hidden",
    entityType: "message",
    entityId: messageId,
    requestId: key,
  });
  res.json({ ok: true, visible });
}
