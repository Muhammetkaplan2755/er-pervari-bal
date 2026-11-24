import { useEffect } from 'react'

/* Per-page <title> and meta description, kept in sync with the language.
   The static versions for crawlers are written at build time by scripts/prerender.mjs. */
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
