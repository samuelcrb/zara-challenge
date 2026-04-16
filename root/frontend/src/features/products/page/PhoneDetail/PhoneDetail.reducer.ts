// ── Reducer de crossfade de imagen ────────────────────────────────────────────
export type ImageState = { front: string; back: string; fading: boolean }
export type ImageAction =
  | { type: 'init'; url: string }
  | { type: 'set-back'; url: string }
  | { type: 'fade-start' }
  | { type: 'fade-end'; url: string }

export const imageReducer = (state: ImageState, action: ImageAction): ImageState => {
  switch (action.type) {
    case 'init':       return { front: action.url, back: action.url, fading: false }
    case 'set-back':   return { ...state, back: action.url }
    case 'fade-start': return { ...state, fading: true }
    case 'fade-end':   return { ...state, front: action.url, fading: false }
  }
}

// ── Reducer de fade del nombre de color ───────────────────────────────────────
export type ColorNameState = { text: string; visible: boolean }
export type ColorNameAction =
  | { type: 'set'; name: string }
  | { type: 'hide' }
  | { type: 'show'; name: string }

export const colorNameReducer = (state: ColorNameState, action: ColorNameAction): ColorNameState => {
  switch (action.type) {
    case 'set':  return { text: action.name, visible: true }
    case 'hide': return { ...state, visible: false }
    case 'show': return { text: action.name, visible: true }
  }
}
