import { useRef } from 'react'
import styles from './SearchBar.module.scss'

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
          onChange={e => onChange(e.target.value)}
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
