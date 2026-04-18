import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import { act } from '@testing-library/react'
import ScrollToTop from './ScrollToTop'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

const AppWithNav = () => (
  <MemoryRouter initialEntries={['/']}>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Link to="/other">go</Link>} />
      <Route path="/other" element={<span>other</span>} />
    </Routes>
  </MemoryRouter>
)

describe('ScrollToTop', () => {
  it('llama a window.scrollTo(0, 0) al montar', () => {
    render(<AppWithNav />)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('llama a window.scrollTo(0, 0) de nuevo cuando cambia el pathname', async () => {
    const { getByText } = render(<AppWithNav />)
    vi.mocked(window.scrollTo).mockClear()
    await act(async () => { getByText('go').click() })
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
