import { useId } from 'react'

/* Clean vector product illustrations for items that have no photo yet
   (pollen, tahini, molasses, pistachios, gift boxes). They are drawn, not
   photographed, and the lineup labels them as illustrations — swap in real
   photos via productInfo.js when the shop sends them. */

const JARS = {
  suzme: { top: '#f4b23a', bottom: '#a8560a', kind: 'liquid' },
  krem: { top: '#f6e3b4', bottom: '#e2bf72', kind: 'cream' },
  polen: { top: '#f3c13a', bottom: '#d88a14', kind: 'granules' },
  tahin: { top: '#e9d2a8', bottom: '#c9a06a', kind: 'cream' },
  pekmez: { top: '#5a2208', bottom: '#1e0802', kind: 'liquid' },
}

function Jar({ id, uid }) {
  const c = JARS[id]
  const g = `${uid}-fill`
  const glass = `${uid}-glass`
  const lid = `${uid}-lid`
  return (
    <svg viewBox="0 0 200 240" role="presentation">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.top} />
          <stop offset="1" stopColor={c.bottom} />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.82" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={lid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a441" />
          <stop offset="0.5" stopColor="#b47a1c" />
          <stop offset="1" stopColor="#7d4e0c" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="226" rx="70" ry="8" fill="#1d1306" opacity="0.12" />
      {/* contents */}
      <rect x="46" y="74" width="108" height="148" rx="24" fill={`url(#${g})`} />
      {c.kind === 'granules' && (
        <g opacity="0.55">
          {Array.from({ length: 46 }, (_, i) => {
            const x = 56 + ((i * 37) % 88)
            const y = 86 + ((i * 53) % 128)
            return <circle key={i} cx={x} cy={y} r={2.6 + (i % 3)} fill={i % 4 === 0 ? '#9a4f05' : '#fbd56b'} />
          })}
        </g>
      )}
      {c.kind === 'cream' && <path d="M58 92 q42 -14 84 0" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" fill="none" strokeLinecap="round" />}
      {c.kind === 'liquid' && <rect x="58" y="84" width="10" height="120" rx="5" fill="#fff" opacity="0.22" />}
      {/* glass */}
      <rect x="42" y="58" width="116" height="168" rx="28" fill={`url(#${glass})`} stroke="#1d1306" strokeOpacity="0.14" strokeWidth="2" />
      {/* label band */}
      <rect x="42" y="128" width="116" height="46" fill="#f3e6cc" opacity="0.92" />
      <path d="M100 138 l11 6.4 v12.7 l-11 6.4 l-11 -6.4 v-12.7 z" fill="none" stroke="#9a4f05" strokeWidth="2.4" />
      {/* lid */}
      <rect x="54" y="30" width="92" height="32" rx="9" fill={`url(#${lid})`} />
      {Array.from({ length: 11 }, (_, i) => <rect key={i} x={60 + i * 8} y="34" width="2" height="24" rx="1" fill="#000" opacity="0.12" />)}
    </svg>
  )
}

function Pistachios({ uid }) {
  const bowl = `${uid}-bowl`
  const nuts = Array.from({ length: 24 }, (_, i) => ({
    x: 52 + ((i * 29) % 96),
    y: 96 + ((i * 17) % 44) - Math.abs(((i * 29) % 96) - 48) * 0.35,
    r: ((i * 47) % 70) - 35,
  }))
  return (
    <svg viewBox="0 0 200 240" role="presentation">
      <defs>
        <linearGradient id={bowl} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a2b" />
          <stop offset="1" stopColor="#4a2c10" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="214" rx="74" ry="9" fill="#1d1306" opacity="0.12" />
      {nuts.map((n, i) => (
        <g key={i} transform={`translate(${n.x} ${n.y}) rotate(${n.r})`}>
          <ellipse rx="13" ry="9" fill="#e7d3ae" stroke="#b59767" strokeWidth="1.2" />
          <ellipse rx="8" ry="4.6" cx="1.5" fill="#7fa33c" />
          <path d="M-12 0 Q0 -3 12 0" stroke="#9c7e52" strokeWidth="1" fill="none" />
        </g>
      ))}
      <path d="M26 136 h148 q-6 74 -74 78 q-68 -4 -74 -78 z" fill={`url(#${bowl})`} />
      <ellipse cx="100" cy="136" rx="74" ry="8" fill="#a06a35" />
    </svg>
  )
}

// One palette per box so the three gift boxes don't read as the same item.
const BOXES = {
  'kutu-kahvalti': { a: '#f3e6cc', b: '#d9c29a', lid: '#e9d6b0', ribbon: '#9a4f05', bow: '#c06a10' },
  'kutu-karakovan': { a: '#3a2410', b: '#1d1306', lid: '#4a2e14', ribbon: '#f2a516', bow: '#ffcf5c' },
  'kutu-bayram': { a: '#7a1e14', b: '#4a0f08', lid: '#8e2a1c', ribbon: '#e8c46a', bow: '#f5dc8e' },
}

function GiftBox({ id, uid }) {
  const c = BOXES[id] ?? BOXES['kutu-karakovan']
  const box = `${uid}-box`
  return (
    <svg viewBox="0 0 200 240" role="presentation">
      <defs>
        <linearGradient id={box} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.a} />
          <stop offset="1" stopColor={c.b} />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="214" rx="80" ry="9" fill="#1d1306" opacity="0.14" />
      <rect x="28" y="96" width="144" height="116" rx="10" fill={`url(#${box})`} />
      <rect x="22" y="78" width="156" height="30" rx="8" fill={c.lid} />
      <rect x="92" y="78" width="16" height="134" fill={c.ribbon} />
      <path d="M100 78 C78 44 54 58 72 76 Z M100 78 C122 44 146 58 128 76 Z" fill={c.bow} stroke={c.ribbon} strokeWidth="2" />
      <path d="M100 146 l14 8 v16 l-14 8 l-14 -8 v-16 z" fill="none" stroke={c.bow} strokeWidth="2.4" opacity="0.85" />
    </svg>
  )
}

export default function ProductArt({ id }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  if (id === 'fistik') return <Pistachios uid={uid} />
  if (id.startsWith('kutu')) return <GiftBox id={id} uid={uid} />
  // Panelden eklenen, çizimi olmayan yeni ürünler: genel bal kavanozu.
  return <Jar id={JARS[id] ? id : 'suzme'} uid={uid} />
}

// Her ürünün bir çizimi var (bilinmeyenler genel kavanoz).
export const hasArt = () => true
