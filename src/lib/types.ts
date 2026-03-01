export interface Measurement {
  date: string
  weight: number
}

export interface Item {
  id: string
  name: string
  color: string
  initialWeight: number
  initialDate: string
  targetLossPercent: number
  measurements: Measurement[]
}

export interface AppData {
  items: Item[]
}

export interface Prefs {
  language: string | null
  weightUnit: 'g' | 'oz'
  dateFormat: 'auto' | 'dmy' | 'mdy'
}

export interface Regression {
  slope: number
  intercept: number
}

export interface CompletionEstimate {
  daysToTarget: number
  estDate: Date
  reg: Regression
}
