import { describe, it, expect } from 'vitest'
import { sanitizeSearch } from './SearchBar'

describe('sanitizeSearch', () => {
  it('permite letras, dígitos, espacios, guiones, signos más y puntos', () => {
    expect(sanitizeSearch('Galaxy S24+ Ultra 5.0')).toBe('Galaxy S24+ Ultra 5.0')
  })

  it('elimina caracteres de inyección HTML y script', () => {
    expect(sanitizeSearch('<script>alert(1)</script>')).toBe('scriptalert1script')
    expect(sanitizeSearch('foo"bar;baz')).toBe('foobarbaz')
    expect(sanitizeSearch('a&b=c|d')).toBe('abcd')
  })

  it('no permite un espacio al principio', () => {
    expect(sanitizeSearch(' Samsung')).toBe('Samsung')
  })

  it('colapsa espacios consecutivos en uno solo', () => {
    expect(sanitizeSearch('Galaxy  S24')).toBe('Galaxy S24')
    expect(sanitizeSearch('a   b   c')).toBe('a b c')
  })

  it('permite un único espacio entre palabras', () => {
    expect(sanitizeSearch('iPhone 15 Pro Max')).toBe('iPhone 15 Pro Max')
  })

  it('trunca a 50 caracteres', () => {
    const long = 'a'.repeat(60)
    expect(sanitizeSearch(long)).toHaveLength(50)
  })

  it('devuelve cadena vacía para entrada completamente inválida', () => {
    expect(sanitizeSearch('<>&"\';{}')).toBe('')
  })

  it('permite letras acentuadas y unicode', () => {
    expect(sanitizeSearch('Teléfono Móvil')).toBe('Teléfono Móvil')
  })
})
