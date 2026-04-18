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

describe('componente SearchBar', () => {
  // ─── Renderizado ───────────────────────────────────────────────────────────

  it('renderiza el campo de búsqueda con el placeholder correcto', () => {
    setup()
    expect(screen.getByPlaceholderText('Busca un smartphone...')).toBeInTheDocument()
  })

  it('renderiza 1 "resultado" (singular) cuando resultsCount es 1', () => {
    setup({ resultsCount: 1 })
    expect(screen.getByText('1 resultado')).toBeInTheDocument()
  })

  it('renderiza N "resultados" (plural) cuando resultsCount es 0', () => {
    setup({ resultsCount: 0 })
    expect(screen.getByText('0 resultados')).toBeInTheDocument()
  })

  it('renderiza N "resultados" (plural) cuando resultsCount es mayor que 1', () => {
    setup({ resultsCount: 42 })
    expect(screen.getByText('42 resultados')).toBeInTheDocument()
  })

  // ─── Botón de limpiar ──────────────────────────────────────────────────────

  it('no muestra el botón de borrar cuando el valor está vacío', () => {
    setup({ value: '' })
    expect(screen.queryByLabelText('Borrar búsqueda')).not.toBeInTheDocument()
  })

  it('muestra el botón de borrar cuando el valor no está vacío', () => {
    setup({ value: 'Samsung' })
    expect(screen.getByLabelText('Borrar búsqueda')).toBeInTheDocument()
  })

  // ─── Interacciones ─────────────────────────────────────────────────────────

  it('llama a onChange con un valor saneado cuando el usuario escribe', async () => {
    const { user, onChange } = setup()
    const input = screen.getByRole('searchbox')
    // Input controlado: cada tecla dispara onChange con sanitizeSearch(char).
    // Se prueba un solo carácter para evitar confusión por acumulación.
    await user.type(input, 'S')
    expect(onChange).toHaveBeenCalledWith('S')
  })

  it('elimina caracteres no permitidos mediante sanitizeSearch', async () => {
    const { user, onChange } = setup()
    const input = screen.getByRole('searchbox')
    await user.type(input, '<')
    // '<' es eliminado por sanitizeSearch, por lo que onChange recibe ''
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('llama a onChange con cadena vacía al hacer clic en el botón de borrar', async () => {
    const { user, onChange } = setup({ value: 'Samsung' })
    await user.click(screen.getByLabelText('Borrar búsqueda'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('llama al callback onClear opcional al hacer clic en el botón de borrar', async () => {
    const onClear = vi.fn()
    const { user } = setup({ value: 'Samsung', onClear })
    await user.click(screen.getByLabelText('Borrar búsqueda'))
    expect(onClear).toHaveBeenCalled()
  })

  it('enfoca el campo tras hacer clic en borrar', async () => {
    const { user } = setup({ value: 'Samsung' })
    const input = screen.getByRole('searchbox')
    await user.click(screen.getByLabelText('Borrar búsqueda'))
    expect(input).toHaveFocus()
  })
})
