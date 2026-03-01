import type { Item, CompletionEstimate, Regression } from './types'

export const COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#264653', '#a8dadc', '#d62828', '#6a994e', '#bc6c25',
  '#606c38', '#283618', '#dda15e', '#8338ec', '#3a86ff',
]

export function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function nextColor(usedColors: string[]): string {
  const used = new Set(usedColors)
  return COLORS.find(c => !used.has(c)) ?? COLORS[usedColors.length % COLORS.length]
}

export function lossPercent(initialWeight: number, currentWeight: number): number {
  if (initialWeight === 0) return 0
  return ((initialWeight - currentWeight) / initialWeight) * 100
}

export function daysBetween(a: string | Date, b: string | Date): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

export function linearRegression(
  points: { x: number; y: number }[]
): Regression | null {
  const n = points.length
  if (n < 2) return null
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (const p of points) {
    sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x
  }
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

export function estimateCompletion(item: Item): CompletionEstimate | null {
  const allPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }]
  const sorted = [...item.measurements].sort((a, b) => a.date.localeCompare(b.date))
  for (const m of sorted) {
    allPoints.push({
      x: daysBetween(item.initialDate, m.date),
      y: lossPercent(item.initialWeight, m.weight),
    })
  }
  const reg = linearRegression(allPoints)
  if (!reg || reg.slope <= 0) return null
  const daysToTarget = (item.targetLossPercent - reg.intercept) / reg.slope
  const estDate = new Date(new Date(item.initialDate).getTime() + daysToTarget * 86400000)
  return { daysToTarget, estDate, reg }
}
