import { createAuthClient } from "better-auth/react";

// Same-origin in dev (Vite proxies /api/auth to the API); explicit URL in prod.
const baseURL = import.meta.env.VITE_API_URL || window.location.origin;
export const authClient = createAuthClient({ baseURL });
export const { useSession, signIn, signUp, signOut } = authClient;
