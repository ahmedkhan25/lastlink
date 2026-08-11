import { generateReactHelpers } from "@uploadthing/react";
import { getApiUrl } from "./api.js";

// Endpoint names live in apps/api/src/uploadthing.ts (profilePhoto). The app
// build doesn't type-check across workspaces, so the router is typed loosely —
// the endpoint string is the contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { useUploadThing } = generateReactHelpers<any>({
  url: `${getApiUrl()}/api/uploadthing`,
});
