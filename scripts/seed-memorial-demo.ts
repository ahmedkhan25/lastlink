import { pool, query } from "../apps/api/src/db.js";
import { ensureMemorial } from "../apps/api/src/memorial-slug.js";

const MEMORIAL_BASE_URL = process.env.MEMORIAL_BASE_URL ?? "http://localhost:5276";

const stories = [
  {
    headline: "A generous spirit, a patient teacher, and the warmest laugh in the room.",
    location: "Austin, Texas",
    quote: "Be kind. It costs nothing, and it outlives you.",
    story: "They made people feel seen. Family remembers the long dinners, the handwritten notes, and the way every small victory became a reason to celebrate together.",
    serviceWhen: "Saturday at 11:00 AM",
    serviceDetails: "A celebration of life with family and friends. In lieu of flowers, guests may support the family-selected hospice fund.",
  },
  {
    headline: "Beloved friend, devoted parent, and lifelong maker of beautiful things.",
    location: "Fort Worth, Texas",
    quote: "A good life is measured in the people you help along the way.",
    story: "Curiosity guided their life—from early morning walks to late-night conversations. They brought calm to difficult moments and joy to ordinary ones.",
    serviceWhen: "Sunday at 2:00 PM",
    serviceDetails: "Friends are invited to share stories at the family gathering. Bright colors are warmly encouraged.",
  },
  {
    headline: "A life of service, laughter, and deep love for family.",
    location: "Dallas, Texas",
    quote: "Leave every room a little lighter than you found it.",
    story: "They built community wherever they went. Their kindness appeared in practical ways: a meal at the right time, a ride home, or a phone call that lasted as long as needed.",
    serviceWhen: "Friday at 4:00 PM",
    serviceDetails: "A private service will be followed by an open remembrance reception for friends, neighbours, and colleagues.",
  },
] as const;

const gallery = [
  ["/assets/gallery/garden-walk.webp"],
  ["/assets/gallery/workshop-memory.webp"],
  ["/assets/gallery/family-table.webp"],
] as const;

const seededCondolences = [
  "I will always remember how welcome they made everyone feel. That generosity changed more lives than they ever knew.",
  "A patient teacher and a wonderful friend. I still hear their advice whenever I face something difficult.",
  "Thinking of the whole family. Their stories, humour, and kindness will stay with us for a very long time.",
] as const;

async function seedPartners(): Promise<void> {
  const partnerRows = [
    { name: "Willow & Rose Florals", type: "florist", kind: "flowers", title: "Send a thoughtful arrangement", description: "Seasonal flowers prepared with care and delivered with a handwritten remembrance card.", image: "/assets/offerings/flowers.webp", price: "From $49", cta: "Send flowers" },
    { name: "Community Hospice Fund", type: "charity", kind: "donation", title: "Give in their memory", description: "Make a tribute gift supporting compassionate hospice care for another family.", image: "/assets/offerings/hospice.webp", price: "Any amount", cta: "Make a donation" },
    { name: "Legacy Grove", type: "memorial", kind: "memorial", title: "Plant a memorial tree", description: "Dedicate a native tree and receive a keepsake certificate for the family.", image: "/assets/offerings/tree.webp", price: "From $35", cta: "Plant a tree" },
  ] as const;

  for (const [sortOrder, item] of partnerRows.entries()) {
    const partner = await query<{ id: string }>(
      `insert into app.partners (name, type)
       select $1, $2 where not exists (select 1 from app.partners where name = $1)
       returning id`, [item.name, item.type]);
    const partnerId = partner.rows[0]?.id ?? (
      await query<{ id: string }>("select id from app.partners where name = $1 limit 1", [item.name])
    ).rows[0]!.id;
    await query(
      `insert into app.offerings
         (partner_id, kind, title, description, active, image_url, price_label, cta_label, sponsor_label, sort_order)
       select $1,$2,$3,$4,true,$5,$6,$7,'Remembrance partner',$8
       where not exists (select 1 from app.offerings where partner_id = $1 and title = $3)`,
      [partnerId, item.kind, item.title, item.description, item.image, item.price, item.cta, sortOrder],
    );
    await query(
      `update app.offerings set description=$1, active=true, image_url=$2, price_label=$3,
              cta_label=$4, sponsor_label='Remembrance partner', sort_order=$5
        where partner_id=$6 and title=$7`,
      [item.description, item.image, item.price, item.cta, sortOrder, partnerId, item.title],
    );
  }
}

async function main(): Promise<void> {
  const registrants = await query<{ id: string; legal_name: string }>(
    "select id, legal_name from app.registrants order by created_at limit 3",
  );
  if (registrants.rowCount === 0) throw new Error("No registrants exist. Create test users before seeding memorials.");

  for (const [index, registrant] of registrants.rows.entries()) {
    await ensureMemorial({ registrantId: registrant.id, legalName: registrant.legal_name });
    const content = stories[index]!;
    const memorial = await query<{ id: string; slug: string }>(
      `update app.memorials set headline=$1, location=$2, birth_year=$3, death_year=$4,
              quote=$5, story=$6, service_when=$7, service_details=$8,
              status='published', published_at=coalesce(published_at, now())
        where registrant_id=$9 returning id, slug`,
      [content.headline, content.location, 1955 + index * 7, 2026, content.quote, content.story,
        content.serviceWhen, content.serviceDetails, registrant.id],
    );
    const row = memorial.rows[0]!;
    for (const [sortOrder, url] of gallery[index]!.entries()) {
      await query(
        `insert into app.memorial_media (memorial_id, url, caption, alt_text, sort_order)
         select $1,$2,$3,$3,$4
          where not exists (select 1 from app.memorial_media where memorial_id=$1 and url=$2)`,
        [row.id, url, `A treasured memory of ${registrant.legal_name}`, sortOrder],
      );
    }
    await query(
      `insert into app.condolences (memorial_id, author_name, relationship, body, status)
       select $1,'A family friend','Friend',$2,'approved'
        where not exists (select 1 from app.condolences where memorial_id=$1 and body=$2)`,
      [row.id, seededCondolences[index]],
    );
    await query(
      `update app.messages set visible_on_memorial=true where id = (
         select id from app.messages where registrant_id=$1 and status in ('ready','released')
         order by created_at limit 1
       )`, [registrant.id]);
    console.log(`${registrant.legal_name}: ${MEMORIAL_BASE_URL}/${row.slug}`);
  }
  await seedPartners();
}

main().finally(() => pool.end());
