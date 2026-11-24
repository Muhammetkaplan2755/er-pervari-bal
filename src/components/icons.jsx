/* Logo — a single comb cell with an inner cell, echoing the shop's hexagon shelving. */
export const Logo = (props) => (
  <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" {...props}>
    <path d="M14 1.5 24.8 7.75v12.5L14 26.5 3.2 20.25V7.75L14 1.5Z" fill="#F2A516" />
    <path d="M14 8.4 18.9 11.2v5.6L14 19.6l-4.9-2.8v-5.6L14 8.4Z" fill="#140800" />
  </svg>
)

export const Pin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" {...props}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
)

export const Instagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.9" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export const ArrowRight = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
)

export const Menu = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M4 8h16M4 16h16" />
  </svg>
)

export const Close = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

/* Small hexagon used as a list mark for what's on the counter. */
export const Cell = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" {...props}>
    <path d="M10 2.2 16.8 6.1v7.8L10 17.8 3.2 13.9V6.1L10 2.2Z" />
  </svg>
)

export const Bag = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8Z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeLinecap="round" />
  </svg>
)

export const Plus = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M10 4v12M4 10h12" />
  </svg>
)

export const Minus = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M4 10h12" />
  </svg>
)

export const WhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.8-1.3A9.4 9.4 0 1 0 12 2.5Zm0 17.2c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.8.8.8-2.8-.2-.3a7.8 7.8 0 1 1 6.6 3.6Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2Z" />
  </svg>
)

export const SHOP = {
  instagram: 'https://www.instagram.com/erpervari_bal/',
  handle: '@erpervari_bal',
  maps: 'https://www.google.com/maps/search/?api=1&query=Er+Pervari+Bal+Bak%C4%B1rc%C4%B1lar+%C3%87ar%C5%9F%C4%B1s%C4%B1+Gaziantep',
}
