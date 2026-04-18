import { describe, it, expect } from 'vitest'
import { imageReducer, colorNameReducer } from './PhoneDetail.reducer'
import type { ImageState, ColorNameState } from './PhoneDetail.reducer'

describe('imageReducer', () => {
  const base: ImageState = { front: 'a.jpg', back: 'a.jpg', fading: false }

  it('init establece front y back a la URL y fading a false', () => {
    const result = imageReducer({ front: '', back: '', fading: true }, { type: 'init', url: 'x.jpg' })
    expect(result).toEqual({ front: 'x.jpg', back: 'x.jpg', fading: false })
  })

  it('set-back actualiza solo la URL de back', () => {
    const result = imageReducer(base, { type: 'set-back', url: 'b.jpg' })
    expect(result).toEqual({ front: 'a.jpg', back: 'b.jpg', fading: false })
  })

  it('fade-start establece fading a true', () => {
    const result = imageReducer(base, { type: 'fade-start' })
    expect(result).toEqual({ ...base, fading: true })
  })

  it('fade-end actualiza front a la nueva URL y establece fading a false', () => {
    const fading: ImageState = { front: 'a.jpg', back: 'b.jpg', fading: true }
    const result = imageReducer(fading, { type: 'fade-end', url: 'b.jpg' })
    expect(result).toEqual({ front: 'b.jpg', back: 'b.jpg', fading: false })
  })
})

describe('colorNameReducer', () => {
  const base: ColorNameState = { text: 'Black', visible: true }

  it('set actualiza text y establece visible a true', () => {
    const result = colorNameReducer({ text: '', visible: false }, { type: 'set', name: 'White' })
    expect(result).toEqual({ text: 'White', visible: true })
  })

  it('hide establece visible a false sin cambiar text', () => {
    const result = colorNameReducer(base, { type: 'hide' })
    expect(result).toEqual({ text: 'Black', visible: false })
  })

  it('show actualiza text y establece visible a true', () => {
    const result = colorNameReducer({ text: 'Black', visible: false }, { type: 'show', name: 'Red' })
    expect(result).toEqual({ text: 'Red', visible: true })
  })
})
