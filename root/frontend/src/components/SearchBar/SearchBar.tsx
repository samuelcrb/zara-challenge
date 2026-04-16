import { useRef } from 'react'
import type React from 'react'
import styles from './SearchBar.module.scss'

const MAX_SEARCH_LENGTH = 50

/**
 * Whitelist-based sanitization for the search input.
 * Allows letters (including accented/unicode), digits, spaces, hyphens, plus and dots —
 * the only characters that can legitimately appear in a phone brand or model name.
 * Collapses consecutive spaces and enforces a max length.
 */
export const sanitizeSearch = (raw: string): string =>
  raw
    .replace(/[^\p{L}\p{N}\s\-+.]/gu, '') // lista blanca: letras, dígitos, espacios, - + .
    .replace(/^\s/, '')                    // sin espacio al inicio
    .replace(/\s{2,}/g, ' ')              // sin espacios consecutivos
    .slice(0, MAX_SEARCH_LENGTH)

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  resultsCount: number
  rightSlot?: React.ReactNode
  filterSlot?: React.ReactNode
  hideResults?: boolean
}

const SearchBar = ({ value, onChange, onClear, resultsCount, rightSlot, filterSlot, hideResults }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onClear?.()
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder="Busca un smartphone..."
          value={value}
          onChange={e => onChange(sanitizeSearch(e.target.value))}
          aria-label="Busca un smartphone"
        />
        {value && (
          <button className={styles.clearButton} onClick={handleClear} aria-label="Borrar búsqueda">
            ✕
          </button>
        )}
      </div>
      <div className={styles.bottomRow}>
        <div className={styles.leftSlot}>
          <p className={`${styles.results}${hideResults ? ` ${styles.resultsHidden}` : ''}`} aria-live="polite">
            {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'}
          </p>
          {filterSlot}
        </div>
        {rightSlot}
      </div>
    </div>
  )
}

export default SearchBar
