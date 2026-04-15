import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from '@/components/SearchBar/SearchBar'

const setup = (overrides: Partial<React.ComponentProps<typeof SearchBar>> = {}) => {
  const onChange = vi.fn()
  const user = userEvent.setup()
  const utils = render(
    <SearchBar
      value=""
      onChange={onChange}
      resultsCount={0}
      {...overrides}
    />,
  )
  return { ...utils, onChange, user }
}

describe('SearchBar component', () => {
  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('renders the search input with correct placeholder', () => {
    setup()
    expect(screen.getByPlaceholderText('Search for a smartphone...')).toBeInTheDocument()
  })

  it('renders 1 "result" (singular) when resultsCount is 1', () => {
    setup({ resultsCount: 1 })
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('renders N "results" (plural) when resultsCount is 0', () => {
    setup({ resultsCount: 0 })
    expect(screen.getByText('0 results')).toBeInTheDocument()
  })

  it('renders N "results" (plural) when resultsCount is many', () => {
    setup({ resultsCount: 42 })
    expect(screen.getByText('42 results')).toBeInTheDocument()
  })

  // ─── Clear button ──────────────────────────────────────────────────────────

  it('does not show the clear button when value is empty', () => {
    setup({ value: '' })
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
  })

  it('shows the clear button when value is non-empty', () => {
    setup({ value: 'Samsung' })
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  // ─── Interactions ──────────────────────────────────────────────────────────

  it('calls onChange with a sanitized value when the user types', async () => {
    const { user, onChange } = setup()
    const input = screen.getByRole('searchbox')
    // Controlled input: each keystroke fires onChange with sanitizeSearch(char).
    // We test a single character to avoid accumulation confusion.
    await user.type(input, 'S')
    expect(onChange).toHaveBeenCalledWith('S')
  })

  it('strips disallowed characters through sanitizeSearch', async () => {
    const { user, onChange } = setup()
    const input = screen.getByRole('searchbox')
    await user.type(input, '<')
    // '<' is stripped by sanitizeSearch, so onChange receives ''
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('calls onChange with empty string when clear button is clicked', async () => {
    const { user, onChange } = setup({ value: 'Samsung' })
    await user.click(screen.getByLabelText('Clear search'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('calls the optional onClear callback when clear button is clicked', async () => {
    const onClear = vi.fn()
    const { user } = setup({ value: 'Samsung', onClear })
    await user.click(screen.getByLabelText('Clear search'))
    expect(onClear).toHaveBeenCalled()
  })

  it('focuses the input after clicking clear', async () => {
    const { user } = setup({ value: 'Samsung' })
    const input = screen.getByRole('searchbox')
    await user.click(screen.getByLabelText('Clear search'))
    expect(input).toHaveFocus()
  })
})
