/* Opens WhatsApp with a pre-filled message in a new tab.
   window.open with the "noopener" feature always returns null, so it can't tell a blocked popup
   from a successful one. Open plainly, then cut the opener link by hand; if a popup blocker
   swallowed the window, fall back to same-tab navigation. */
export function openWhatsApp(number, text) {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`
  const win = window.open(url, '_blank')
  if (win) win.opener = null
  else window.location.href = url
}
