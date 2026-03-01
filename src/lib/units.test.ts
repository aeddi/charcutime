import { describe, it, expect } from 'vitest'
import { toDisplayUnit, fromDisplayUnit, formatWeight } from './units'

describe('toDisplayUnit', () => {
  it('returns grams unchanged', () => {
    expect(toDisplayUnit(500, 'g')).toBe(500)
  })
  it('converts grams to oz correctly', () => {
    expect(toDisplayUnit(453.592, 'oz')).toBeCloseTo(16, 1)
  })
})

describe('fromDisplayUnit', () => {
  it('returns grams unchanged', () => {
    expect(fromDisplayUnit(500, 'g')).toBe(500)
  })
  it('roundtrips oz → g → oz', () => {
    const oz = 16
    expect(toDisplayUnit(fromDisplayUnit(oz, 'oz'), 'oz')).toBeCloseTo(oz, 4)
  })
})

describe('formatWeight', () => {
  it('formats grams below 1kg', () => {
    expect(formatWeight(500, 'g')).toBe('500 g')
  })
  it('formats grams as kg above 1000g', () => {
    expect(formatWeight(1500, 'g')).toBe('1.500 kg')
  })
  it('formats oz below 1lb', () => {
    expect(formatWeight(100, 'oz')).toMatch(/oz$/)
  })
  it('formats as lb above 453g', () => {
    expect(formatWeight(500, 'oz')).toMatch(/lb$/)
  })
})
