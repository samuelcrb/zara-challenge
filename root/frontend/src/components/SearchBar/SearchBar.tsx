import { useRef } from 'react'
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
    .replace(/[^\p{L}\p{N}\s\-+.]/gu, '') // whitelist: letters, digits, spaces, - + .
    .replace(/^\s/, '')                    // no leading space
    .replace(/\s{2,}/g, ' ')              // no consecutive spaces
    .slice(0, MAX_SEARCH_LENGTH)

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  resultsCount: number
}

const SearchBar = ({ value, onChange, onClear, resultsCount }: SearchBarProps) => {
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
          placeholder="Search for a smartphone..."
          value={value}
          onChange={e => onChange(sanitizeSearch(e.target.value))}
          aria-label="Search for a smartphone"
        />
        {value && (
          <button className={styles.clearButton} onClick={handleClear} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>
      <p className={styles.results} aria-live="polite">
        {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
      </p>
    </div>
  )
}

export default SearchBar
