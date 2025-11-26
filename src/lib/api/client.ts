type ApiOptions = {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  token?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

