import { generateReactHelpers } from "@uploadthing/react";
import { getApiUrl } from "./api.js";

// Endpoint strings are the cross-surface contract with apps/api/src/uploadthing.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { useUploadThing } = generateReactHelpers<any>({
  url: `${getApiUrl()}/api/uploadthing`,
});
