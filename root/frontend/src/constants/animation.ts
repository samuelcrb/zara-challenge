export const BAR_COMPLETE_DURATION = 300 // ms — must match CSS transition in Navbar.module.scss
export const CONTENT_REVEAL_DELAY = BAR_COMPLETE_DURATION + 50
export const FADE_DURATION = 300 // ms — all fade animations — must match $animation-duration-fade in _variables.scss
export const GRID_EXIT_DURATION = 350 // ms — must match slide exit durations in PhoneGrid.module.scss
// ─── Page transition (Framer Motion — values in seconds) ──────────────────────
export const PAGE_TRANSITION = {
  duration: 0.15,
  ease: [0.22, 1, 0.36, 1] as const, // cubic-bezier matching existing slideDown easing
}

export const HEADER_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
  slideDistance: 20, // px — how far the header elements travel
}
