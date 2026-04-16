export const BAR_COMPLETE_DURATION = 300 // ms — debe coincidir con la transición CSS en Navbar.module.scss
export const CONTENT_REVEAL_DELAY = BAR_COMPLETE_DURATION + 50
export const FADE_DURATION = 300 // ms — todas las animaciones de fade — debe coincidir con $animation-duration-fade en _variables.scss
export const GRID_EXIT_DURATION = 350 // ms — debe coincidir con las duraciones de salida en PhoneGrid.module.scss
// ─── Transición de página (Framer Motion — valores en segundos) ───────────────
export const PAGE_TRANSITION = {
  duration: 0.15,
  ease: [0.22, 1, 0.36, 1] as const, // cubic-bezier que coincide con el easing del slideDown existente
}

export const HEADER_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
  slideDistance: 20, // px — distancia que recorren los elementos de cabecera
}
