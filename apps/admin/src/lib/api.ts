const TOKEN_KEY = 'adminToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function redirectToLogin() {
  clearToken();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

export async function adminApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      redirectToLogin();
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function adminUploadTo(
  path: string,
  file: File,
): Promise<{
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}> {
  const token = getToken();
  const body = new FormData();
  body.append('file', file);

  const res = await fetch(path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirectToLogin();
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Ошибка загрузки');
  }

  return res.json();
}

export async function adminUpload(file: File) {
  return adminUploadTo('/api/admin/media/upload', file);
}

export async function adminUploadAnswerMedia(file: File) {
  return adminUploadTo('/api/admin/media/upload/answer-media', file);
}
