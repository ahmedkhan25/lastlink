import { z } from "zod";

export const MEMORIAL_STATUSES = ["draft", "published", "hidden"] as const;
export type MemorialStatus = (typeof MEMORIAL_STATUSES)[number];

export const CONDOLENCE_STATUSES = ["pending", "approved", "hidden"] as const;
export type CondolenceStatus = (typeof CONDOLENCE_STATUSES)[number];

export const createCondolenceSchema = z.object({
  authorName: z.string().trim().min(1).max(80),
  authorEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  relationship: z.string().trim().max(80).optional(),
  body: z.string().trim().min(1).max(1_500),
  imageUrl: z.string().trim().url().optional(),
  imageKey: z.string().trim().max(300).optional(),
});

export type CreateCondolenceInput = z.infer<typeof createCondolenceSchema>;

export interface PublicMemorialPayload {
  memorial: {
    slug: string;
    displayName: string;
    portraitUrl: string | null;
    headline: string | null;
    location: string | null;
    birthYear: number | null;
    deathYear: number | null;
    quote: string | null;
    story: string | null;
    serviceWhen: string | null;
    serviceDetails: string | null;
  };
  gallery: Array<{ id: string; url: string; caption: string | null; altText: string | null }>;
  condolences: Array<{
    id: string;
    authorName: string;
    relationship: string | null;
    body: string;
    imageUrl: string | null;
    createdAt: string;
  }>;
  publicMessages: Array<{
    id: string;
    type: "video" | "audio" | "letter";
    title: string | null;
    durationSeconds: number | null;
    thumbnailUrl: string | null;
  }>;
  offerings: Array<{
    id: string;
    kind: "flowers" | "donation" | "memorial";
    title: string;
    description: string | null;
    providerName: string | null;
    imageUrl: string | null;
    priceLabel: string | null;
    ctaLabel: string;
    sponsorLabel: string | null;
  }>;
}
