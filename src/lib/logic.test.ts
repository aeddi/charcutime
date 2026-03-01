import { describe, it, expect } from 'vitest'
import { lossPercent, daysBetween, linearRegression, estimateCompletion, nextColor, COLORS } from './logic'
import type { Item } from './types'

// ── lossPercent ──
describe('lossPercent', () => {
  it('returns correct percentage', () => {
    expect(lossPercent(500, 400)).toBeCloseTo(20)
  })
  it('returns 0 when no weight lost', () => {
    expect(lossPercent(500, 500)).toBe(0)
  })
  it('returns 0 when initialWeight is 0 (guard)', () => {
    expect(lossPercent(0, 0)).toBe(0)
  })
  it('handles current weight greater than initial', () => {
    expect(lossPercent(500, 600)).toBeCloseTo(-20)
  })
})

// ── daysBetween ──
describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0)
  })
  it('returns 1 for consecutive days', () => {
    expect(daysBetween('2025-01-01', '2025-01-02')).toBe(1)
  })
  it('returns 30 for a month', () => {
    expect(daysBetween('2025-01-01', '2025-01-31')).toBe(30)
  })
  it('accepts Date objects', () => {
    expect(daysBetween(new Date('2025-01-01'), new Date('2025-01-08'))).toBe(7)
  })
})

// ── linearRegression ──
describe('linearRegression', () => {
  it('returns null for empty array', () => {
    expect(linearRegression([])).toBeNull()
  })
  it('returns null for single point', () => {
    expect(linearRegression([{ x: 1, y: 2 }])).toBeNull()
  })
  it('returns null when all x are identical (vertical line)', () => {
    expect(linearRegression([{ x: 1, y: 2 }, { x: 1, y: 5 }])).toBeNull()
  })
  it('computes correct slope and intercept for known data', () => {
    // y = 2x + 1
    const pts = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }]
    const reg = linearRegression(pts)
    expect(reg).not.toBeNull()
    expect(reg!.slope).toBeCloseTo(2)
    expect(reg!.intercept).toBeCloseTo(1)
  })
})

// ── estimateCompletion ──
describe('estimateCompletion', () => {
  const base: Item = {
    id: '1', name: 'Test', color: '#fff',
    initialWeight: 500, initialDate: '2025-01-01',
    targetLossPercent: 30, measurements: [],
  }

  it('returns null with no measurements', () => {
    expect(estimateCompletion(base)).toBeNull()
  })
  it('returns a valid estimate with one measurement (origin + 1 point = 2)', () => {
    const item = { ...base, measurements: [{ date: '2025-01-10', weight: 480 }] }
    const result = estimateCompletion(item)
    expect(result).not.toBeNull()
    expect(result!.estDate).toBeInstanceOf(Date)
  })
  it('returns null when slope is zero or negative', () => {
    const item = {
      ...base,
      measurements: [
        { date: '2025-01-10', weight: 510 },
        { date: '2025-01-20', weight: 520 },
      ],
    }
    expect(estimateCompletion(item)).toBeNull()
  })
  it('projects a future completion date for normal drying', () => {
    const item = {
      ...base,
      measurements: [
        { date: '2025-01-15', weight: 475 }, // 5% loss after 14 days
        { date: '2025-01-31', weight: 450 }, // 10% loss after 30 days
      ],
    }
    const result = estimateCompletion(item)
    expect(result).not.toBeNull()
    expect(result!.estDate.getTime()).toBeGreaterThan(new Date('2025-01-31').getTime())
    expect(result!.daysToTarget).toBeGreaterThan(30)
  })
})

// ── nextColor ──
describe('nextColor', () => {
  it('returns first color when none used', () => {
    expect(nextColor([])).toBe(COLORS[0])
  })
  it('skips already-used colors', () => {
    expect(nextColor([COLORS[0]])).toBe(COLORS[1])
  })
  it('wraps around when all colors used', () => {
    const result = nextColor(COLORS)
    expect(COLORS).toContain(result)
  })
})
