import { describe, it, expect } from 'vitest'
import { imageReducer, colorNameReducer } from './PhoneDetail.reducer'
import type { ImageState, ColorNameState } from './PhoneDetail.reducer'

describe('imageReducer', () => {
  const base: ImageState = { front: 'a.jpg', back: 'a.jpg', fading: false }

  it('init sets both front and back to the url and fading to false', () => {
    const result = imageReducer({ front: '', back: '', fading: true }, { type: 'init', url: 'x.jpg' })
    expect(result).toEqual({ front: 'x.jpg', back: 'x.jpg', fading: false })
  })

  it('set-back updates only the back url', () => {
    const result = imageReducer(base, { type: 'set-back', url: 'b.jpg' })
    expect(result).toEqual({ front: 'a.jpg', back: 'b.jpg', fading: false })
  })

  it('fade-start sets fading to true', () => {
    const result = imageReducer(base, { type: 'fade-start' })
    expect(result).toEqual({ ...base, fading: true })
  })

  it('fade-end updates front to new url and sets fading to false', () => {
    const fading: ImageState = { front: 'a.jpg', back: 'b.jpg', fading: true }
    const result = imageReducer(fading, { type: 'fade-end', url: 'b.jpg' })
    expect(result).toEqual({ front: 'b.jpg', back: 'b.jpg', fading: false })
  })
})

describe('colorNameReducer', () => {
  const base: ColorNameState = { text: 'Black', visible: true }

  it('set updates text and sets visible to true', () => {
    const result = colorNameReducer({ text: '', visible: false }, { type: 'set', name: 'White' })
    expect(result).toEqual({ text: 'White', visible: true })
  })

  it('hide sets visible to false without changing text', () => {
    const result = colorNameReducer(base, { type: 'hide' })
    expect(result).toEqual({ text: 'Black', visible: false })
  })

  it('show updates text and sets visible to true', () => {
    const result = colorNameReducer({ text: 'Black', visible: false }, { type: 'show', name: 'Red' })
    expect(result).toEqual({ text: 'Red', visible: true })
  })
})
