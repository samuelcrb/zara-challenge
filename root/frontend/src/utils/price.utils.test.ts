import { describe, it, expect } from 'vitest'
import { formatPrice } from './price.utils'

describe('formatPrice', () => {
  it('devuelve precios enteros con decimales ,00', () => {
    expect(formatPrice(999)).toBe('999,00')
    expect(formatPrice(0)).toBe('0,00')
    expect(formatPrice(1000)).toBe('1.000,00')
  })

  it('devuelve precios decimales con separador de coma y siempre 2 decimales', () => {
    expect(formatPrice(99.9)).toBe('99,90')
    expect(formatPrice(100.5)).toBe('100,50')
    expect(formatPrice(9.99)).toBe('9,99')
    expect(formatPrice(1234.56)).toBe('1.234,56')
  })
})