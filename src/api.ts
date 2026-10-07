// fetch + JSON, throwing the server's `error` (or the status) on a non-2xx answer.
export async function json<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? `${response.status} ${response.statusText}`);
  }
  return body as T;
}

export function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  return json<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
