import type { AppData, Prefs } from './types'

const DATA_KEY = 'charcutime_data'
const PREFS_KEY = 'charcutime_prefs'

const DEFAULT_PREFS: Prefs = {
  language: null,
  weightUnit: 'g',
  dateFormat: 'auto',
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch { /* ignore */ }
  return { items: [] }
}

export function saveData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) } as Prefs
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFS }
}

export function savePrefs(prefs: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
