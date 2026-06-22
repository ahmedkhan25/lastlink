// Single place every API call resolves its base URL (see SKILL: getApiUrl()).
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:10000";
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
