import { describe, it, expect } from 'vitest'
import { formatPrice } from './price.utils'

describe('formatPrice', () => {
  it('returns integer prices without decimals', () => {
    expect(formatPrice(999)).toBe('999')
    expect(formatPrice(0)).toBe('0')
    expect(formatPrice(1000)).toBe('1.000')
  })

  it('returns decimal prices with comma separator and 2 decimal places', () => {
    expect(formatPrice(99.9)).toBe('99,9')
    expect(formatPrice(100.5)).toBe('100,5')
    expect(formatPrice(9.99)).toBe('9,99')
    expect(formatPrice(1234.56)).toBe('1.234,56')
  })
})
