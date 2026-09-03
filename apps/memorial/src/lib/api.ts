export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:10000";
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`);
  if (!response.ok) throw new Error(response.status === 404 ? "not-found" : `HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}
