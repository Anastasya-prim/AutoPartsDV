const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-change"));
}

export function removeToken(): void {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth-change"));
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getUserRole(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = opts;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || data.error || `Ошибка ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }

  return data as T;
}
