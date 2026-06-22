// Single place every API call resolves its base URL (see SKILL: getApiUrl()).
// In dev this is "" — the Vite proxy forwards /api and /graphql to the API on
// the same origin (first-party cookies, no CORS). In prod, set VITE_API_URL.
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? "";
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
