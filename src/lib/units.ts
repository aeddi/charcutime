export type WeightUnit = 'g' | 'oz'

const OZ_PER_GRAM = 0.03527396

export function toDisplayUnit(grams: number, unit: WeightUnit): number {
  return unit === 'oz' ? grams * OZ_PER_GRAM : grams
}

export function fromDisplayUnit(value: number, unit: WeightUnit): number {
  return unit === 'oz' ? value / OZ_PER_GRAM : value
}

export function formatWeight(grams: number, unit: WeightUnit): string {
  if (unit === 'oz') {
    const oz = grams * OZ_PER_GRAM
    return oz >= 16
      ? `${(oz / 16).toFixed(2)} lb`
      : `${oz.toFixed(1)} oz`
  }
  return grams >= 1000
    ? `${(grams / 1000).toFixed(3)} kg`
    : `${grams} g`
}
