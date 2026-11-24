import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { findItem, shippingFor } from '../data/catalog.js'

const STORAGE_KEY = 'erpervari-sepet-v1'
const CartContext = createContext(null)

/* Lines are keyed "productId:variantId" so the same honey in two sizes is two lines. */
function reducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const key = `${action.productId}:${action.variantId}`
      const qty = (lines[key] ?? 0) + (action.qty ?? 1)
      return { ...lines, [key]: Math.min(qty, 99) }
    }
    case 'set': {
      const next = { ...lines }
      if (action.qty <= 0) delete next[action.key]
      else next[action.key] = Math.min(action.qty, 99)
      return next
    }
    case 'clear':
      return {}
    default:
      return lines
  }
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    // Drop lines whose product or size no longer exists in the catalog.
    return Object.fromEntries(
      Object.entries(raw).filter(([key, qty]) => {
        const [p, v] = key.split(':')
        const found = findItem(p, v)
        return found && found.product.stock !== 'out' && Number.isInteger(qty) && qty > 0
      }),
    )
  } catch {
    return {}
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)) } catch { /* private mode: cart just won't persist */ }
  }, [lines])

  const value = useMemo(() => {
    const items = Object.entries(lines).map(([key, qty]) => {
      const [p, v] = key.split(':')
      const { product, variant } = findItem(p, v)
      return { key, qty, product, variant, total: variant.price * qty }
    })
    const subtotal = items.reduce((sum, i) => sum + i.total, 0)
    const shipping = shippingFor(subtotal)
    return {
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add: (productId, variantId, qty = 1) => dispatch({ type: 'add', productId, variantId, qty }),
      /* pairs: [[productId, variantId], …] — used by recipes and the quiz. Skips sold-out items. */
      addMany: (pairs) => pairs.forEach(([p, v]) => {
        const found = findItem(p, v)
        if (found && found.product.stock !== 'out') dispatch({ type: 'add', productId: p, variantId: v, qty: 1 })
      }),
      setQty: (key, qty) => dispatch({ type: 'set', key, qty }),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [lines, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
