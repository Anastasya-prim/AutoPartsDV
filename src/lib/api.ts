/**
 * API-клиент фронтенда — единственное место, через которое происходит
 * общение с бэкендом (NestJS на порту 4000).
 *
 * Также здесь управление JWT-токеном:
 * - getToken / setToken / removeToken — работа с localStorage
 * - При setToken/removeToken шлётся событие "auth-change",
 *   чтобы Header мгновенно обновил кнопку «Войти» / «Профиль»
 */

/**
 * База URL для запросов к Nest.
 * - Полный URL в NEXT_PUBLIC_API_URL — если API на другом домене.
 * - Иначе в браузере: window.location.origin + префикс (по умолчанию /api).
 *   Так запрос всегда идёт на тот же хост, что и страница (Nginx → api), даже если
 *   в старом бандле был зашит localhost или неверный bake.
 * - На SSR: относительный префикс (обычно fetch из api() не вызывается на сервере).
 */
function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (/^https?:\/\//i.test(env)) {
    return env.replace(/\/+$/, "");
  }
  const prefix =
    env.startsWith("/") && env.length > 0 ? env.replace(/\/+$/, "") : "/api";
  if (typeof window !== "undefined") {
    return `${window.location.origin}${prefix}`;
  }
  return prefix;
}

/** Получить JWT-токен из localStorage (null если нет или рендер на сервере) */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Сохранить токен и уведомить все компоненты об изменении авторизации */
export function setToken(token: string): void {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-change"));
}

/** Удалить токен (выход) и уведомить компоненты */
export function removeToken(): void {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth-change"));
}

/** Проверка: авторизован ли пользователь (есть ли токен) */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/**
 * Достаёт роль пользователя прямо из JWT-токена (без запроса к серверу).
 * JWT состоит из 3 частей: header.payload.signature (разделены точкой).
 * atob() декодирует payload из base64, где хранятся userId, email, role.
 */
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
  method?: string;   // HTTP-метод (GET, POST, PUT, DELETE)
  body?: unknown;     // Тело запроса (будет JSON.stringify)
  auth?: boolean;     // Добавить ли заголовок Authorization с токеном
};

/**
 * Универсальная функция для запросов к бэкенду.
 *
 * Пример использования:
 *   const data = await api<SearchResponse>("/search?q=48157", { auth: true });
 *   const result = await api("/auth/login", { method: "POST", body: { email, password } });
 *
 * При ошибке бросает Error с сообщением от сервера.
 */
export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = opts;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const hint =
      raw.trimStart().startsWith("<")
        ? " Пришла HTML вместо JSON: на VPS выполните curl -sS http://127.0.0.1/api/suppliers | head -c 200 — должен быть JSON. Если HTML — проверьте docker compose ps и логи api/nginx. Обновите: git pull && docker compose build --no-cache && docker compose up -d. В браузере: жёсткое обновление (Ctrl+Shift+R)."
        : "";
    throw new Error(`Ответ сервера не JSON.${hint}`);
  }

  if (!res.ok) {
    const errBody = data as { message?: unknown; error?: unknown };
    const msg = errBody.message || errBody.error || `Ошибка ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
  }

  return data as T;
}
