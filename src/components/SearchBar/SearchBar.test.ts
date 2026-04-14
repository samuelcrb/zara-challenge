import { describe, it, expect } from 'vitest'
import { sanitizeSearch } from './SearchBar'

describe('sanitizeSearch', () => {
  it('allows letters, digits, spaces, hyphens, plus and dots', () => {
    expect(sanitizeSearch('Galaxy S24+ Ultra 5.0')).toBe('Galaxy S24+ Ultra 5.0')
  })

  it('strips HTML and script injection characters', () => {
    expect(sanitizeSearch('<script>alert(1)</script>')).toBe('scriptalert1script')
    expect(sanitizeSearch('foo"bar;baz')).toBe('foobarbaz')
    expect(sanitizeSearch('a&b=c|d')).toBe('abcd')
  })

  it('does not allow a leading space', () => {
    expect(sanitizeSearch(' Samsung')).toBe('Samsung')
  })

  it('collapses consecutive spaces into one', () => {
    expect(sanitizeSearch('Galaxy  S24')).toBe('Galaxy S24')
    expect(sanitizeSearch('a   b   c')).toBe('a b c')
  })

  it('allows a single space between words', () => {
    expect(sanitizeSearch('iPhone 15 Pro Max')).toBe('iPhone 15 Pro Max')
  })

  it('truncates to 50 characters', () => {
    const long = 'a'.repeat(60)
    expect(sanitizeSearch(long)).toHaveLength(50)
  })

  it('returns empty string for fully invalid input', () => {
    expect(sanitizeSearch('<>&"\';{}')).toBe('')
  })

  it('allows accented and unicode letters', () => {
    expect(sanitizeSearch('Teléfono Móvil')).toBe('Teléfono Móvil')
  })
})
