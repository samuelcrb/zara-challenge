import { describe, it, expect } from 'vitest'
import { formatPrice } from './price.utils'

describe('formatPrice', () => {
  it('returns integer prices with ,00 decimals', () => {
    expect(formatPrice(999)).toBe('999,00')
    expect(formatPrice(0)).toBe('0,00')
    expect(formatPrice(1000)).toBe('1.000,00')
  })

  it('returns decimal prices with comma separator and always 2 decimal places', () => {
    expect(formatPrice(99.9)).toBe('99,90')
    expect(formatPrice(100.5)).toBe('100,50')
    expect(formatPrice(9.99)).toBe('9,99')
    expect(formatPrice(1234.56)).toBe('1.234,56')
  })
})