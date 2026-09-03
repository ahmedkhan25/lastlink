import { query } from "./db.js";

export function memorialSlug({ legalName, registrantId }: { legalName: string; registrantId: string }): string {
  const base = legalName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "memorial";
  return `${base}-${registrantId.slice(0, 6)}`;
}

export async function ensureMemorial({
  registrantId,
  legalName,
}: {
  registrantId: string;
  legalName: string;
}): Promise<void> {
  await query(
    `insert into app.memorials (registrant_id, slug)
     values ($1, $2)
     on conflict (registrant_id) do nothing`,
    [registrantId, memorialSlug({ legalName, registrantId })],
  );
}
