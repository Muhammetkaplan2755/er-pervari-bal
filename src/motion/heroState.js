/* Shared, mutable hero scroll progress (0..1). Hero.jsx writes it from the
   scroll engine; the lazily loaded 3D comb reads it every frame. A plain
   object keeps three.js out of the main bundle and avoids React re-renders. */
export const heroScroll = { p: 0, wake: null }
