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
  // ─── Renderizado ───────────────────────────────────────────────────────────

  it('renders the search input with correct placeholder', () => {
    setup()
    expect(screen.getByPlaceholderText('Busca un smartphone...')).toBeInTheDocument()
  })

  it('renders 1 "result" (singular) when resultsCount is 1', () => {
    setup({ resultsCount: 1 })
    expect(screen.getByText('1 resultado')).toBeInTheDocument()
  })

  it('renders N "results" (plural) when resultsCount is 0', () => {
    setup({ resultsCount: 0 })
    expect(screen.getByText('0 resultados')).toBeInTheDocument()
  })

  it('renders N "results" (plural) when resultsCount is many', () => {
    setup({ resultsCount: 42 })
    expect(screen.getByText('42 resultados')).toBeInTheDocument()
  })

  // ─── Botón de limpiar ──────────────────────────────────────────────────────

  it('does not show the clear button when value is empty', () => {
    setup({ value: '' })
    expect(screen.queryByLabelText('Borrar búsqueda')).not.toBeInTheDocument()
  })

  it('shows the clear button when value is non-empty', () => {
    setup({ value: 'Samsung' })
    expect(screen.getByLabelText('Borrar búsqueda')).toBeInTheDocument()
  })

  // ─── Interacciones ─────────────────────────────────────────────────────────

  it('calls onChange with a sanitized value when the user types', async () => {
    const { user, onChange } = setup()
    const input = screen.getByRole('searchbox')
    // Input controlado: cada tecla dispara onChange con sanitizeSearch(char).
    // Se prueba un solo carácter para evitar confusión por acumulación.
    await user.type(input, 'S')
    expect(onChange).toHaveBeenCalledWith('S')
  })

  it('strips disallowed characters through sanitizeSearch', async () => {
    const { user, onChange } = setup()
    const input = screen.getByRole('searchbox')
    await user.type(input, '<')
    // '<' es eliminado por sanitizeSearch, por lo que onChange recibe ''
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('calls onChange with empty string when clear button is clicked', async () => {
    const { user, onChange } = setup({ value: 'Samsung' })
    await user.click(screen.getByLabelText('Borrar búsqueda'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('calls the optional onClear callback when clear button is clicked', async () => {
    const onClear = vi.fn()
    const { user } = setup({ value: 'Samsung', onClear })
    await user.click(screen.getByLabelText('Borrar búsqueda'))
    expect(onClear).toHaveBeenCalled()
  })

  it('focuses the input after clicking clear', async () => {
    const { user } = setup({ value: 'Samsung' })
    const input = screen.getByRole('searchbox')
    await user.click(screen.getByLabelText('Borrar búsqueda'))
    expect(input).toHaveFocus()
  })
})
