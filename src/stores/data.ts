import { writable, get } from 'svelte/store'
import { loadData, saveData, loadPrefs, savePrefs } from '../lib/storage'
import type { AppData, Prefs, Item, Measurement } from '../lib/types'
import { uuid, nextColor } from '../lib/logic'
import {
  getToken, setToken, clearToken, getUser,
  requestDeviceCode, pollForToken,
  findGist, readGist, writeGist, createGist,
} from '../lib/github'
import { mergeData } from '../lib/sync'

// ── Stores ──

export const appData = writable<AppData>(loadData())
export const prefs = writable<Prefs>(loadPrefs())

export interface SyncState {
  status: 'idle' | 'polling' | 'syncing' | 'error'
  username: string | null
  gistId: string | null
  lastSynced: string | null  // ISO timestamp
  error: string | null
}

export const syncState = writable<SyncState>({
  status: 'idle',
  username: null,
  gistId: null,
  lastSynced: null,
  error: null,
})

// Pending conflict to resolve — set by syncOnLogin, consumed by SyncConflictDialog
export interface ConflictPayload {
  local: AppData
  remote: AppData
  gistId: string
  token: string
}

export const pendingConflict = writable<ConflictPayload | null>(null)

// ── Item mutations ──

export function addItem(fields: Omit<Item, 'id' | 'color' | 'measurements'>) {
  appData.update(d => {
    d.items.push({
      ...fields,
      id: uuid(),
      color: nextColor(d.items.map(i => i.color)),
      measurements: [],
    })
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function updateItem(id: string, fields: Omit<Item, 'id' | 'color' | 'measurements'>) {
  appData.update(d => {
    const item = d.items.find(i => i.id === id)
    if (item) Object.assign(item, fields)
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function deleteItem(id: string) {
  appData.update(d => {
    d.items = d.items.filter(i => i.id !== id)
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function addMeasurement(itemId: string, m: Measurement) {
  appData.update(d => {
    const item = d.items.find(i => i.id === itemId)
    if (item) {
      item.measurements.push(m)
      item.measurements.sort((a, b) => a.date.localeCompare(b.date))
    }
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function deleteMeasurement(itemId: string, index: number) {
  appData.update(d => {
    const item = d.items.find(i => i.id === itemId)
    if (item) item.measurements.splice(index, 1)
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

// ── Prefs mutations ──

export function updatePrefs(patch: Partial<Prefs>) {
  prefs.update(p => {
    Object.assign(p, patch)
    savePrefs(p)
    return p
  })
}

// ── Export / Import ──

export function exportData() {
  const data = get(appData)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'charcutime_backup.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function importDataFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target!.result as string) as AppData
        if (!parsed.items || !Array.isArray(parsed.items)) {
          reject(new Error('Invalid file format'))
          return
        }
        appData.set(parsed)
        saveData(parsed)
        resolve()
      } catch {
        reject(new Error('Failed to parse JSON file'))
      }
    }
    reader.readAsText(file)
  })
}

// ── Sync helpers ──

let _gistId: string | null = null
let _token: string | null = null
let _syncDebounce: ReturnType<typeof setTimeout> | null = null

function setSyncing(error?: string) {
  syncState.update(s => ({ ...s, status: error ? 'error' : 'syncing', error: error ?? null }))
}

async function pushToGist(data: AppData) {
  if (!_token || !_gistId) return
  setSyncing()
  try {
    await writeGist(_token, _gistId, JSON.stringify(data, null, 2))
    syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
  } catch (e) {
    setSyncing(e instanceof Error ? e.message : 'Sync failed')
  }
}

/** Auto-sync after data changes (debounced 5 s). */
export function scheduleSyncAfterChange() {
  if (!_token || !_gistId) return
  if (_syncDebounce) clearTimeout(_syncDebounce)
  _syncDebounce = setTimeout(() => pushToGist(get(appData)), 5000)
}

/** Full sync: read remote, merge/conflict, write back. */
export async function syncNow(opts?: { forceDirection?: 'upload' | 'download' }) {
  if (!_token) return
  setSyncing()
  try {
    const local = get(appData)
    if (!_gistId) {
      _gistId = (await findGist(_token))?.id ?? null
      if (!_gistId) {
        _gistId = await createGist(_token, JSON.stringify(local, null, 2))
        syncState.update(s => ({ ...s, gistId: _gistId, status: 'idle', lastSynced: new Date().toISOString() }))
        return
      }
      syncState.update(s => ({ ...s, gistId: _gistId }))
    }

    if (opts?.forceDirection === 'upload') {
      await pushToGist(local)
      return
    }

    const raw = await readGist(_token, _gistId)
    const remote: AppData = JSON.parse(raw)

    if (opts?.forceDirection === 'download') {
      appData.set(remote)
      saveData(remote)
      syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
      return
    }

    const localEmpty = local.items.length === 0
    const remoteEmpty = !remote.items || remote.items.length === 0

    if (localEmpty) {
      appData.set(remote)
      saveData(remote)
      syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
      return
    }
    if (remoteEmpty) {
      await pushToGist(local)
      return
    }

    // Both non-empty — let the UI decide (conflict dialog)
    pendingConflict.set({ local, remote, gistId: _gistId, token: _token })
    syncState.update(s => ({ ...s, status: 'idle' }))
  } catch (e) {
    setSyncing(e instanceof Error ? e.message : 'Sync failed')
  }
}

/** Resolve a pending conflict and write the chosen data to both local and remote. */
export async function resolveConflict(choice: 'local' | 'remote' | 'merge') {
  const conflict = get(pendingConflict)
  if (!conflict) return
  const { local, remote, gistId, token } = conflict

  const resolved =
    choice === 'local' ? local :
    choice === 'remote' ? remote :
    mergeData(local, remote)

  appData.set(resolved)
  saveData(resolved)
  pendingConflict.set(null)

  try {
    await writeGist(token, gistId, JSON.stringify(resolved, null, 2))
    syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
  } catch (e) {
    syncState.update(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : 'Sync failed' }))
  }
}

// ── Device Flow login ──

export interface DeviceFlowState {
  userCode: string
  verificationUri: string
}

export const deviceFlowState = writable<DeviceFlowState | null>(null)

export async function startLogin(): Promise<void> {
  syncState.update(s => ({ ...s, status: 'polling', error: null }))
  try {
    const dc = await requestDeviceCode()
    deviceFlowState.set({ userCode: dc.user_code, verificationUri: dc.verification_uri })

    let interval = dc.interval * 1000

    await new Promise<void>((resolve, reject) => {
      const poll = async () => {
        try {
          const res = await pollForToken(dc.device_code)
          if (res.access_token) {
            _token = res.access_token
            setToken(res.access_token)
            resolve()
          } else if (res.error === 'authorization_pending') {
            setTimeout(poll, interval)
          } else if (res.error === 'slow_down') {
            interval += 5000
            setTimeout(poll, interval)
          } else {
            reject(new Error(res.error ?? 'Authorization failed'))
          }
        } catch (e) {
          reject(e)
        }
      }
      setTimeout(poll, interval)
    })

    deviceFlowState.set(null)

    const user = await getUser(_token!)
    syncState.update(s => ({ ...s, status: 'idle', username: user.login }))

    await syncNow()
  } catch (e) {
    deviceFlowState.set(null)
    syncState.update(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : 'Login failed' }))
  }
}

export async function resumeSession() {
  const token = getToken()
  if (!token) return
  _token = token
  try {
    const user = await getUser(token)
    syncState.update(s => ({ ...s, username: user.login }))
    await syncNow()
  } catch {
    // Token expired or invalid — clear it silently
    clearToken()
    _token = null
  }
}

export function logout() {
  clearToken()
  _token = null
  _gistId = null
  syncState.set({ status: 'idle', username: null, gistId: null, lastSynced: null, error: null })
}
