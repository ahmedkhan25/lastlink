import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import { query } from "./db.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";

// Profile photo upload (issues-sheet round, 2026-08-10). UploadThing is the
// interim storage provider — the stored value is just a URL on the registrant
// row, so moving to S3 later only changes where the file lands.

const f = createUploadthing();

// Explicit FileRouter annotation: with declaration emit on, tsc can't name the
// inferred builder type portably (TS2742).
export const uploadRouter: FileRouter = {
  profilePhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const who = await requireRegistrant(req.headers);
      if (!who) throw new UploadThingError("Unauthorized");
      return { registrantId: who.registrantId, userId: who.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const url = file.ufsUrl;
      await query("update app.registrants set avatar_url = $1, updated_at = now() where id = $2", [
        url,
        metadata.registrantId,
      ]);
      await logEvent({
        actorType: "registrant",
        actorId: metadata.userId,
        action: "profile.photo_updated",
        entityType: "registrant",
        entityId: metadata.registrantId,
        data: { key: file.key },
      });
      return { avatarUrl: url };
    }),
};

export type UploadRouter = typeof uploadRouter;
