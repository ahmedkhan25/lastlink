// Single place every API call resolves its base URL (see SKILL: getApiUrl()).
// In dev this is "" — the Vite proxy forwards /api and /graphql to the API on
// the same origin (first-party cookies, no CORS). In prod, set VITE_API_URL.
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? "";
}

/** Public marketing homepage (the logo links back to it). */
export function getMarketingUrl(): string {
  return import.meta.env.VITE_MARKETING_URL ?? "https://lastlink-marketing.onrender.com";
}

/** Advocate re-entry surface — for someone named as an advocate, whenever the day comes. */
export function getAdvocateUrl(): string {
  return import.meta.env.VITE_ADVOCATE_URL ?? "http://localhost:5274";
}

export interface GqlError {
  message: string;
}

/** Call the Express /graphql proxy (which injects the Hasura role from the session). */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${getApiUrl()}/graphql`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: GqlError[] };
  if (json.errors?.length) throw new Error(json.errors[0]!.message);
  return json.data as T;
}

/** POST JSON to a sensitive Express endpoint (auth via session cookie). */
export async function postApi<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
