// GitHub Device Flow OAuth + Gist sync
// The CLIENT_ID is public (Device Flow doesn't use a client secret).
// Set VITE_GITHUB_CLIENT_ID in your environment / GitHub Actions secrets.
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string ?? ''

export const GIST_FILENAME = 'charcutime-data.json'
export const SCOPES = 'gist'
export const TOKEN_KEY = 'charcutime_token'

// ── Token helpers ──

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Device Flow ──

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export interface TokenResponse {
  access_token?: string
  error?: string
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: SCOPES }),
  })
  if (!res.ok) throw new Error(`Device code request failed: ${res.status}`)
  return res.json()
}

export async function pollForToken(deviceCode: string): Promise<TokenResponse> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  })
  if (!res.ok) throw new Error(`Token poll failed: ${res.status}`)
  return res.json()
}

// ── GitHub API helpers ──

export async function getUser(token: string): Promise<{ login: string }> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch user info')
  return res.json()
}

// ── Gist operations ──

export interface GistFile {
  filename: string
  content: string
}

export interface Gist {
  id: string
  files: Record<string, GistFile>
}

export async function findGist(token: string): Promise<Gist | null> {
  let page = 1
  while (true) {
    const res = await fetch(`https://api.github.com/gists?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('Failed to list gists')
    const gists: Gist[] = await res.json()
    if (gists.length === 0) return null
    const found = gists.find(g => GIST_FILENAME in g.files)
    if (found) return found
    if (gists.length < 100) return null
    page++
  }
}

export async function readGist(token: string, gistId: string): Promise<string> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to read gist')
  const gist: Gist = await res.json()
  return gist.files[GIST_FILENAME]?.content ?? '{}'
}

export async function writeGist(token: string, gistId: string, content: string): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } }),
  })
  if (!res.ok) throw new Error('Failed to write gist')
}

export async function createGist(token: string, content: string): Promise<string> {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public: false,
      description: 'CharcuTime data',
      files: { [GIST_FILENAME]: { content } },
    }),
  })
  if (!res.ok) throw new Error('Failed to create gist')
  const gist: Gist = await res.json()
  return gist.id
}
