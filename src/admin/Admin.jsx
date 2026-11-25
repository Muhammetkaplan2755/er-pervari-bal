import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES } from '../data/catalog.js'
import { auth, configured, costs as costsApi, images as imagesApi, inventory as inventoryApi, isDemo, orders as ordersApi, products as productsApi, serverAction, settings as settingsApi } from './api.js'
import { STATUS_LABEL, buildReport, monthRange, money } from './report.js'
import './Admin.css'

/* /yonetim — dükkân yönetici paneli (yalnızca Türkçe).
   Siparişler · Rapor · Ürünler · Ayarlar. Veri Supabase'de, erişim RLS ile. */

const TABS = [
  ['siparisler', 'Siparişler'],
  ['rapor', 'Rapor'],
  ['urunler', 'Ürünler'],
  ['ayarlar', 'Ayarlar'],
]
const STOCK = { in: 'Var', low: 'Az kaldı', out: 'Tükendi', preorder: 'Ön sipariş' }
const PAY = { kart: 'Kart', havale: 'Havale', kapida: 'Kapıda' }

/* WhatsApp siparişinde sözleşmenin müşteriye "kalıcı veri saklayıcıyla" teyidi
   (Mesafeli Sözleşmeler Yönetmeliği): dükkânın kendi WhatsApp'ından gidecek hazır mesaj. */
const waPhone = (raw) => {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('5')) return `90${d}`
  if (d.length === 11 && d.startsWith('05')) return `9${d}`
  if (d.length === 12 && d.startsWith('905')) return d
  return null
}
function confirmText(o) {
  const items = (o.items ?? []).map((i) => `• ${i.qty} × ${i.name} ${i.label}`).join('\n')
  const site = typeof location !== 'undefined' ? location.origin : ''
  return [
    `Merhaba ${o.customer?.name ?? ''}, Er Pervari Bal siparişiniz onaylandı.`,
    `Sipariş no: ${o.id}`,
    '',
    items,
    `Toplam (KDV dahil): ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(o.total) || 0)}`,
    `Ödeme: ${PAY[o.payment_method] ?? o.payment_method}`,
    '',
    'Teslimden itibaren 14 gün cayma hakkınız vardır; ambalajı açılmış gıda ürünlerinde (hijyen) cayma hakkı yoktur.',
    `Ön bilgilendirme formu: ${site}/yasal/on-bilgilendirme-formu`,
    `Mesafeli satış sözleşmesi: ${site}/yasal/mesafeli-satis-sozlesmesi`,
  ].join('\n')
}
const trOf = (v) => (v && typeof v === 'object' ? v.tr ?? '' : v ?? '')
const dt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

function thisMonth() {
  const d = new Date(Date.now() + 3 * 3600 * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const rangeOf = (ym) => monthRange(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)))

/* ---------- küçük yardımcılar ---------- */
function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    return fn().then(
      (data) => setState({ loading: false, data, error: '' }),
      (e) => setState({ loading: false, data: null, error: e.message }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { run() }, [run])
  return [state, run]
}

function Notice({ kind = 'info', children }) {
  return <p className={`adm-notice adm-notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</p>
}

/* ---------- giriş ---------- */
function Login({ recovery, onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (recovery) {
        await auth.updatePassword(password)
        setMsg({ kind: 'ok', text: 'Yeni şifre kaydedildi.' })
        onDone?.()
      } else {
        await auth.signIn(email.trim(), password)
      }
    } catch (err) {
      setMsg({ kind: 'error', text: err.message === 'Invalid login credentials' ? 'E-posta ya da şifre yanlış.' : err.message })
    } finally {
      setBusy(false)
    }
  }

  const forgot = async () => {
    if (!email.trim()) return setMsg({ kind: 'error', text: 'Önce e-posta adresinizi yazın.' })
    try {
      await auth.resetPassword(email.trim())
      setMsg({ kind: 'ok', text: 'Şifre yenileme bağlantısı e-postanıza gönderildi.' })
    } catch (err) {
      setMsg({ kind: 'error', text: err.message })
    }
  }

  return (
    <form className="adm-login" onSubmit={submit}>
      <h1>Er Pervari Bal <span>Yönetim</span></h1>
      {!recovery && (
        <label>E-posta<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      )}
      <label>{recovery ? 'Yeni şifre' : 'Şifre'}
        <input type="password" autoComplete={recovery ? 'new-password' : 'current-password'} minLength={recovery ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <button className="adm-btn adm-btn--primary" disabled={busy}>{recovery ? 'Şifreyi kaydet' : 'Giriş yap'}</button>
      {!recovery && <button type="button" className="adm-link" onClick={forgot}>Şifremi unuttum</button>}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </form>
  )
}

/* ---------- kart iadesi ---------- */
function RefundBox({ order, onDone }) {
  const left = Math.round((Number(order.total) - (Number(order.refunded) || 0)) * 100) / 100
  const [amount, setAmount] = useState(String(left))
  const [state, setState] = useState('')
  const run = async () => {
    const n = Number(amount)
    if (!(n > 0) || n > left) return setState(`0 ile ${left} TL arasında bir tutar girin.`)
    if (!window.confirm(`${order.id} siparişi için ${n} TL müşterinin kartına iade edilecek.\n\nBu işlem GERİ ALINAMAZ. Devam edilsin mi?`)) return
    setState('İade ediliyor…')
    try {
      const r = await serverAction('iade', { orderId: order.id, amount: n })
      setState(r.method === 'cancel' ? 'Ödeme iptal edildi; müşteri kartından çekim kalkar.' : `${r.amount} TL iade edildi; bankaya göre kartına birkaç gün içinde yansır.`)
      if (r.order) onDone(r.order)
    } catch (e) {
      setState(`İade yapılamadı: ${e.message}`)
    }
  }
  return (
    <div className="adm-refund">
      <label>Kartına iade (₺)<input type="number" min="0" step="0.01" max={left} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <button type="button" className="adm-btn adm-btn--danger" onClick={run}>Kartına iade et</button>
      <span className="adm-muted">{state || 'Tamamı bugün iade edilirse ödeme iptal edilir. Kısmi iade de yapılabilir. Durumu elle “İade” yapmak parayı geri göndermez; bu düğmeyi kullanın.'}</span>
    </div>
  )
}

/* ---------- siparişler ---------- */
function OrderRow({ order, onSaved }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ status: order.status, extra_cost: order.extra_cost ?? 0, tracking_code: order.tracking_code ?? '', admin_note: order.admin_note ?? '' })
  const [state, setState] = useState('')
  // Sipariş dışarıdan değişirse (ör. iade durumu "iade" yaptı) taslağı yenile; eski durum geri kaydedilmesin.
  useEffect(() => {
    setDraft({ status: order.status, extra_cost: order.extra_cost ?? 0, tracking_code: order.tracking_code ?? '', admin_note: order.admin_note ?? '' })
  }, [order])
  const c = order.customer ?? {}
  const dirty = draft.status !== order.status || Number(draft.extra_cost) !== Number(order.extra_cost) || draft.tracking_code !== (order.tracking_code ?? '') || draft.admin_note !== (order.admin_note ?? '')

  const save = async () => {
    setState('saving')
    try {
      const saved = await ordersApi.update(order.id, { ...draft, extra_cost: Number(draft.extra_cost) || 0 })
      onSaved(saved)
      setState('ok')
    } catch (e) {
      setState(e.message)
    }
  }

  return (
    <>
      <tr className={`adm-order adm-order--${order.status}`}>
        <td>{dt.format(new Date(order.created_at))}</td>
        <td><button type="button" className="adm-link" aria-expanded={open} onClick={() => setOpen(!open)}>{order.id}</button></td>
        <td>{c.name}<small>{c.city} / {c.district}</small></td>
        <td>{(order.items ?? []).map((i) => `${i.qty}× ${i.name} ${i.label}`).join(', ')}</td>
        <td className="adm-num">{money(order.total)}</td>
        <td>{PAY[order.payment_method] ?? order.channel}</td>
        <td>
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} aria-label={`${order.id} durumu`}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </td>
      </tr>
      {open && (
        <tr className="adm-order__detail">
          <td colSpan={7}>
            <dl>
              <div><dt>Telefon</dt><dd><a href={`tel:${c.phone}`}>{c.phone}</a></dd></div>
              {c.email && <div><dt>E-posta</dt><dd>{c.email}</dd></div>}
              <div><dt>Adres</dt><dd>{c.address}, {c.district} / {c.city}</dd></div>
              {c.note && <div><dt>Müşteri notu</dt><dd>{c.note}</dd></div>}
              {c.repeat && c.repeat !== 'yok' && <div><dt>Abonelik</dt><dd>{c.repeat}</dd></div>}
              <div><dt>Ara toplam / kargo</dt><dd>{money(order.subtotal)} + {money(order.shipping)}</dd></div>
              {order.channel === 'kart' && <div><dt>iyzico kesintisi</dt><dd>{money(order.commission)}{order.payout != null && ` · hesaba geçecek ${money(order.payout)}`}</dd></div>}
            </dl>
            {order.channel === 'whatsapp' && waPhone(c.phone) && (
              <p className="adm-order__wa">
                <a className="adm-btn" href={`https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(confirmText(order))}`} target="_blank" rel="noopener noreferrer">
                  Müşteriye onay mesajı gönder (WhatsApp)
                </a>
                <span className="adm-muted">Sipariş, tutar, cayma hakkı ve sözleşme bağlantısı yazılı hazır mesaj açılır; göndermeden önce kontrol edin.</span>
              </p>
            )}
            {order.channel === 'kart' && ['odendi', 'kargolandi', 'teslim_edildi'].includes(order.status) && (
              <RefundBox order={order} onDone={onSaved} />
            )}
            {order.channel === 'kart' && Number(order.refunded) > 0 && <p className="adm-muted">İade edilen: {money(order.refunded)}</p>}
            <div className="adm-order__edit">
              <label>Ek gider (kargo, kapıda ödeme ücreti…)<input type="number" min="0" step="0.01" value={draft.extra_cost} onChange={(e) => setDraft({ ...draft, extra_cost: e.target.value })} /></label>
              <label>Kargo takip no<input value={draft.tracking_code} onChange={(e) => setDraft({ ...draft, tracking_code: e.target.value })} /></label>
              <label>Not<input value={draft.admin_note} onChange={(e) => setDraft({ ...draft, admin_note: e.target.value })} /></label>
            </div>
          </td>
        </tr>
      )}
      {(dirty || state) && (
        <tr className="adm-order__save">
          <td colSpan={7}>
            <button type="button" className="adm-btn adm-btn--primary" disabled={!dirty || state === 'saving'} onClick={save}>Kaydet</button>
            {state === 'ok' && !dirty && <span className="adm-ok">Kaydedildi</span>}
            {state && state !== 'ok' && state !== 'saving' && <span className="adm-err">{state}</span>}
          </td>
        </tr>
      )}
    </>
  )
}

function Orders() {
  const [ym, setYm] = useState(thisMonth)
  const [filter, setFilter] = useState('hepsi')
  const [{ loading, data, error }, reload] = useAsync(() => ordersApi.between(rangeOf(ym).from, rangeOf(ym).to), [ym])
  const [list, setList] = useState([])
  useEffect(() => { setList(data ?? []) }, [data])

  const shown = list.filter((o) =>
    filter === 'hepsi' ? true : filter === 'yeni' ? ['odendi', 'beklemede', 'onaylandi'].includes(o.status) : o.status === filter)
  const waiting = list.filter((o) => o.status === 'beklemede').length

  return (
    <section aria-labelledby="adm-orders">
      <header className="adm-bar">
        <h2 id="adm-orders">Siparişler</h2>
        <label>Ay<input type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></label>
        <label>Göster
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="hepsi">Hepsi</option>
            <option value="yeni">Hazırlanacaklar</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <button type="button" className="adm-btn" onClick={reload}>Yenile</button>
      </header>
      {waiting > 0 && <Notice>{waiting} WhatsApp siparişi onay bekliyor. Müşteri mesajı ve ödemesi gelince durumu “Onaylandı” yapın; gelmezse “İptal”.</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {loading ? <p className="adm-muted">Yükleniyor…</p> : shown.length === 0 ? <p className="adm-muted">Bu ay için sipariş yok.</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Tarih</th><th>No</th><th>Müşteri</th><th>Ürünler</th><th className="adm-num">Tutar</th><th>Ödeme</th><th>Durum</th></tr></thead>
            <tbody>
              {shown.map((o) => <OrderRow key={o.id} order={o} onSaved={(s) => setList((l) => l.map((x) => (x.id === s.id ? s : x)))} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ---------- rapor ---------- */
function Report() {
  const [ym, setYm] = useState(thisMonth)
  const [{ loading, data, error }] = useAsync(async () => {
    const { from, to } = rangeOf(ym)
    const [o, c] = await Promise.all([ordersApi.between(from, to), costsApi.list()])
    return buildReport(o, c)
  }, [ym])
  const [sendState, setSendState] = useState('')

  const sendNow = async () => {
    setSendState('Gönderiliyor…')
    try {
      const r = await serverAction('haftalik')
      setSendState(r.skipped ? `Gönderilmedi: ${r.skipped}` : `${r.sent}/${r.total} numaraya gönderildi.`)
    } catch (e) {
      setSendState(`Hata: ${e.message}`)
    }
  }

  const t = data?.totals
  return (
    <section aria-labelledby="adm-report">
      <header className="adm-bar">
        <h2 id="adm-report">Aylık rapor</h2>
        <label>Ay<input type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></label>
        <button type="button" className="adm-btn" onClick={sendNow}>Haftalık raporu şimdi WhatsApp’tan gönder</button>
        {sendState && <span className="adm-muted">{sendState}</span>}
      </header>
      {error && <Notice kind="error">{error}</Notice>}
      {loading || !t ? <p className="adm-muted">Hesaplanıyor…</p> : (
        <>
          <div className="adm-kpis">
            <div><span>Sipariş</span><strong>{t.orders}</strong><small>{t.card} kart · {t.whatsapp} WhatsApp</small></div>
            <div><span>Ciro (kargo dahil)</span><strong>{money(t.revenue)}</strong><small>ürün {money(t.products)} · kargo {money(t.shipping)}</small></div>
            <div><span>Banka / iyzico kesintisi</span><strong>{money(t.commission)}</strong></div>
            <div><span>Ürün maliyeti + ek giderler</span><strong>{money(t.cost + t.extra)}</strong><small>maliyet {money(t.cost)} · ek {money(t.extra)}</small></div>
            <div className="is-net"><span>Net kazanç</span><strong>{money(t.net)}</strong></div>
          </div>
          {data.missingCost.length > 0 && (
            <Notice kind="warn">Maliyeti girilmemiş ürünler var, net kazanç olduğundan yüksek görünür: {data.missingCost.join(', ')}. Ürünler sekmesinden “Birim maliyet” girin.</Notice>
          )}
          {data.byItem.length === 0 ? <p className="adm-muted">Bu ay satış yok. (Yalnızca ödendi / onaylandı / kargoda / teslim edildi durumundaki siparişler sayılır.)</p> : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Ürün</th><th className="adm-num">Adet</th><th className="adm-num">Satış</th><th className="adm-num">Maliyet</th><th className="adm-num">Brüt kâr</th></tr></thead>
                <tbody>
                  {data.byItem.map((r) => (
                    <tr key={r.key}><td>{r.name} <small>{r.label}</small></td><td className="adm-num">{r.qty}</td><td className="adm-num">{money(r.revenue)}</td><td className="adm-num">{money(r.cost)}</td><td className="adm-num">{money(r.profit)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/* ---------- ürünler ---------- */
const slug = (s) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
const withTr = (orig, tr) => (orig && typeof orig === 'object' ? { ...orig, tr } : tr)
const langOf = (v, lang) => (v && typeof v === 'object' ? v[lang] ?? '' : '')
/* Çeviri girilince metin {tr, en, ar} nesnesine döner; boş çeviriler atılır (site Türkçeye düşer). */
function withLang(orig, lang, value) {
  const obj = orig && typeof orig === 'object' ? { ...orig } : { tr: orig ?? '' }
  if (value.trim()) obj[lang] = value
  else delete obj[lang]
  return Object.keys(obj).length === 1 ? obj.tr : obj
}

/* Yüklemeden önce küçült: en uzun kenar 1600 px, WebP. Telefonda çekilen 5-10 MB
   fotoğraflar birkaç yüz KB'a iner, site hızlı kalır. */
async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.85))
    return blob ? new File([blob], 'foto.webp', { type: 'image/webp' }) : file
  } catch {
    return file
  }
}

function Photos({ productId, list, onChange }) {
  const [busy, setBusy] = useState('')
  const upload = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(`${files.length} fotoğraf yükleniyor…`)
    try {
      const urls = []
      for (const f of files) urls.push(await imagesApi.upload(productId, await shrink(f)))
      onChange([...list, ...urls])
      setBusy('')
    } catch (err) {
      setBusy(`Yüklenemedi: ${err.message}`)
    }
  }
  const cover = (i) => onChange([list[i], ...list.filter((_, j) => j !== i)])
  return (
    <fieldset className="adm-photos">
      <legend>Fotoğraflar <span className="adm-muted">(ilki kapak; gerçek ürün fotoğrafı olmalı)</span></legend>
      {list.length > 0 && (
        <ul>
          {list.map((url, i) => (
            <li key={url}>
              <img src={url} alt={`Fotoğraf ${i + 1}`} loading="lazy" />
              {i === 0 ? <span className="adm-pill">Kapak</span> : <button type="button" className="adm-link" onClick={() => cover(i)}>Kapak yap</button>}
              <button type="button" className="adm-link" onClick={() => onChange(list.filter((_, j) => j !== i))}>Kaldır</button>
            </li>
          ))}
        </ul>
      )}
      {productId ? (
        <label className="adm-btn adm-upload">Fotoğraf ekle<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} /></label>
      ) : (
        <p className="adm-muted">Fotoğraf eklemek için önce ürün adını yazın.</p>
      )}
      {busy && <span className="adm-muted" role="status">{busy}</span>}
    </fieldset>
  )
}

function ProductEditor({ product, costRows, stockRows = [], isNew, onSaved, onCancel }) {
  const [p, setP] = useState(() => structuredClone(product))
  const [cost, setCost] = useState(() => Object.fromEntries(product.variants.map((v) => [v.id, costRows.find((c) => c.product_id === product.id && c.variant_id === v.id)?.cost ?? ''])))
  // Stok adedi: boş = takip yok (sınırsız). Adet girilirse satıldıkça kendiliğinden düşer.
  const [stock, setStock] = useState(() => Object.fromEntries(product.variants.map((v) => [v.id, stockRows.find((s) => s.product_id === product.id && s.variant_id === v.id)?.qty ?? ''])))
  const [state, setState] = useState('')
  const photoId = isNew ? (p.id || slug(trOf(p.name))) : p.id

  const setVariant = (i, patch) => setP((x) => ({ ...x, variants: x.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }))

  const save = async () => {
    const name = trOf(p.name).trim()
    const id = isNew ? (p.id || slug(name)) : p.id
    const variants = p.variants
      .map((v) => ({ ...v, id: v.id || slug(trOf(v.label)) || 'tek', price: Number(v.price) }))
      .filter((v) => trOf(v.label).trim() && v.price > 0)
    if (!name || !/^[a-z0-9-]{2,40}$/.test(id)) return setState('Ürün adı gerekli.')
    if (variants.length === 0) return setState('En az bir boyut ve fiyat girin.')
    if (new Set(variants.map((v) => v.id)).size !== variants.length) return setState('İki boyutun adı aynı olamaz.')
    setState('saving')
    try {
      const saved = await productsApi.save({ id, category: p.category, stock: p.stock, name: p.name, note: p.note, variants, images: p.images ?? [], sort: Number(p.sort) || 0, active: p.active })
      // Listeden kaldırılan fotoğraflar ancak kayıttan sonra depodan silinir.
      const kept = new Set(p.images ?? [])
      await Promise.allSettled((product.images ?? []).filter((u) => !kept.has(u)).map((u) => imagesApi.remove(u)))
      const costList = variants.filter((v) => cost[v.id] !== '' && cost[v.id] != null).map((v) => ({ product_id: id, variant_id: v.id, cost: Number(cost[v.id]) || 0 }))
      await costsApi.saveMany(costList)
      const tracked = variants.filter((v) => stock[v.id] !== '' && stock[v.id] != null)
      await inventoryApi.save(tracked.map((v) => ({ product_id: id, variant_id: v.id, qty: Math.max(0, Math.floor(Number(stock[v.id]) || 0)) })))
      const untracked = stockRows.filter((s) => s.product_id === id && !tracked.some((v) => v.id === s.variant_id)).map((s) => s.variant_id)
      await inventoryApi.remove(id, untracked)
      onSaved(saved, costList)
      setState('ok')
    } catch (e) {
      setState(e.message.includes('duplicate') ? 'Bu adla bir ürün zaten var.' : e.message)
    }
  }

  return (
    <div className="adm-editor">
      <div className="adm-grid">
        <label>Ürün adı<input value={trOf(p.name)} onChange={(e) => setP({ ...p, name: withTr(p.name, e.target.value) })} /></label>
        <label>Kısa açıklama<input value={trOf(p.note)} onChange={(e) => setP({ ...p, note: withTr(p.note, e.target.value) })} /></label>
        <label>Grup
          <select value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.tr}</option>)}
          </select>
        </label>
        <label>Stok
          <select value={p.stock} onChange={(e) => setP({ ...p, stock: e.target.value })}>
            {Object.entries(STOCK).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Sıra<input type="number" value={p.sort ?? 0} onChange={(e) => setP({ ...p, sort: e.target.value })} /></label>
        <label className="adm-check"><input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Sitede göster</label>
      </div>
      <details className="adm-langs">
        <summary>İngilizce ve Arapça metinler <span className="adm-muted">(boş bırakılırsa Türkçesi görünür)</span></summary>
        <div className="adm-grid">
          <label>Ad — English<input lang="en" value={langOf(p.name, 'en')} onChange={(e) => setP({ ...p, name: withLang(p.name, 'en', e.target.value) })} /></label>
          <label>Açıklama — English<input lang="en" value={langOf(p.note, 'en')} onChange={(e) => setP({ ...p, note: withLang(p.note, 'en', e.target.value) })} /></label>
          <label>Ad — العربية<input lang="ar" dir="rtl" value={langOf(p.name, 'ar')} onChange={(e) => setP({ ...p, name: withLang(p.name, 'ar', e.target.value) })} /></label>
          <label>Açıklama — العربية<input lang="ar" dir="rtl" value={langOf(p.note, 'ar')} onChange={(e) => setP({ ...p, note: withLang(p.note, 'ar', e.target.value) })} /></label>
        </div>
      </details>

      <Photos productId={photoId} list={p.images ?? []} onChange={(list) => setP((x) => ({ ...x, images: list }))} />

      <table className="adm-table adm-variants">
        <thead><tr><th>Boyut</th><th className="adm-num">Satış fiyatı (₺)</th><th className="adm-num">Birim maliyet (₺)</th><th className="adm-num">Stok adedi</th><th><span className="sr-only">Sil</span></th></tr></thead>
        <tbody>
          {p.variants.map((v, i) => (
            <tr key={i}>
              <td><input aria-label="Boyut" value={trOf(v.label)} onChange={(e) => setVariant(i, { label: withTr(v.label, e.target.value) })} placeholder="ör. 500 g" /></td>
              <td><input aria-label="Satış fiyatı" type="number" min="0" step="1" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} /></td>
              <td><input aria-label="Birim maliyet" type="number" min="0" step="0.01" value={cost[v.id] ?? ''} disabled={!v.id} placeholder={v.id ? '' : 'önce kaydet'} onChange={(e) => setCost({ ...cost, [v.id]: e.target.value })} /></td>
              <td><input aria-label="Stok adedi" type="number" min="0" step="1" value={stock[v.id] ?? ''} disabled={!v.id} placeholder={v.id ? 'takip yok' : 'önce kaydet'} onChange={(e) => setStock({ ...stock, [v.id]: e.target.value })} /></td>
              <td><button type="button" className="adm-link" disabled={p.variants.length === 1} onClick={() => setP({ ...p, variants: p.variants.filter((_, j) => j !== i) })}>Sil</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="adm-link" onClick={() => setP({ ...p, variants: [...p.variants, { id: '', label: '', price: '' }] })}>+ Boyut ekle</button>

      <div className="adm-actions">
        <button type="button" className="adm-btn adm-btn--primary" disabled={state === 'saving'} onClick={save}>Kaydet</button>
        {onCancel && <button type="button" className="adm-btn" onClick={onCancel}>Vazgeç</button>}
        {state === 'ok' && <span className="adm-ok">Kaydedildi. Sitede görünmesi için “Siteye yayınla”ya basın.</span>}
        {state && !['ok', 'saving'].includes(state) && <span className="adm-err">{state}</span>}
      </div>
    </div>
  )
}

const EMPTY_PRODUCT = { id: '', category: 'bal', stock: 'in', name: '', note: '', variants: [{ id: '', label: '', price: '' }], images: [], sort: 100, active: true }

function Products() {
  const [{ loading, data, error }, reload] = useAsync(async () => {
    const [p, c, s] = await Promise.all([productsApi.list(), costsApi.list(), inventoryApi.list().catch(() => [])])
    return { p, c, s }
  }, [])
  const [editing, setEditing] = useState(null)
  const [publish, setPublish] = useState('')

  const doPublish = async () => {
    setPublish('Yayınlanıyor…')
    try {
      await serverAction('yayinla')
      setPublish('Site yeniden hazırlanıyor; yeni fiyatlar 1–3 dakika içinde sitede.')
    } catch (e) {
      setPublish(`Hata: ${e.message}`)
    }
  }

  return (
    <section aria-labelledby="adm-products">
      <header className="adm-bar">
        <h2 id="adm-products">Ürünler ve fiyatlar</h2>
        <button type="button" className="adm-btn" onClick={() => setEditing('__new')}>+ Yeni ürün</button>
        <button type="button" className="adm-btn adm-btn--primary" onClick={doPublish}>Siteye yayınla</button>
        {publish && <span className="adm-muted">{publish}</span>}
      </header>
      <Notice>Fiyat değişikliği ödeme ekranında hemen geçerli olur; ürün sayfalarında görünmesi için “Siteye yayınla”ya basın. Birim maliyet yalnızca raporda kullanılır, sitede görünmez. Stok adedi girilen boyut satıldıkça kendiliğinden düşer, bitince ürün “Tükendi” olur; boş bırakılan boyut takip edilmez.</Notice>
      {error && <Notice kind="error">{error}</Notice>}
      {editing === '__new' && (
        <ProductEditor product={EMPTY_PRODUCT} costRows={[]} isNew onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
      )}
      {loading && !data ? <p className="adm-muted">Yükleniyor…</p> : (
        <ul className="adm-products">
          {(data?.p ?? []).map((p) => (
            <li key={p.id} className={p.active ? '' : 'is-hidden'}>
              <div className="adm-products__head">
                <strong>{trOf(p.name)}</strong>
                <span className="adm-muted">{p.variants.map((v) => {
                  const st = (data.s ?? []).find((x) => x.product_id === p.id && x.variant_id === v.id)
                  return `${trOf(v.label)}: ${money(v.price)}${st ? ` (${st.qty} adet)` : ''}`
                }).join(' · ')}</span>
                <span className={`adm-pill adm-pill--${p.stock}`}>{STOCK[p.stock]}</span>
                {!p.active && <span className="adm-pill">Gizli</span>}
                <button type="button" className="adm-link" aria-expanded={editing === p.id} onClick={() => setEditing(editing === p.id ? null : p.id)}>{editing === p.id ? 'Kapat' : 'Düzenle'}</button>
              </div>
              {editing === p.id && <ProductEditor product={p} costRows={data.c} stockRows={data.s ?? []} onSaved={() => reload()} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ---------- iki adımlı doğrulama ---------- */
function MfaChallenge({ onDone }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    try {
      const [factor] = await auth.mfa.factors()
      await auth.mfa.verify(factor.id, code.replace(/\D/g, ''))
      onDone()
    } catch (err) {
      setMsg(err.message.includes('Invalid') ? 'Kod yanlış ya da süresi doldu.' : err.message)
    }
  }
  return (
    <form className="adm-login" onSubmit={submit}>
      <h1>İki adımlı <span>doğrulama</span></h1>
      <label>Doğrulama uygulamasındaki 6 haneli kod
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
      </label>
      <button className="adm-btn adm-btn--primary">Doğrula</button>
      <button type="button" className="adm-link" onClick={auth.signOut}>Çıkış yap</button>
      {msg && <Notice kind="error">{msg}</Notice>}
    </form>
  )
}

function MfaSetup() {
  const [{ loading, data, error }, reload] = useAsync(() => auth.mfa.factors(), [])
  const [enroll, setEnroll] = useState(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')

  const start = async () => {
    setMsg('')
    try { setEnroll(await auth.mfa.enroll()) } catch (e) { setMsg(e.message) }
  }
  const confirm = async (e) => {
    e.preventDefault()
    try {
      await auth.mfa.verify(enroll.id, code.replace(/\D/g, ''))
      setEnroll(null)
      setCode('')
      setMsg('İki adımlı doğrulama açıldı. Bundan sonra girişte telefon kodu da istenecek.')
      reload()
    } catch (err) {
      setMsg(err.message.includes('Invalid') ? 'Kod yanlış ya da süresi doldu, tekrar deneyin.' : err.message)
    }
  }
  const remove = async (id) => {
    if (!window.confirm('İki adımlı doğrulama kapatılsın mı? Hesap yalnızca şifreyle korunur.')) return
    try { await auth.mfa.unenroll(id); setMsg('Kapatıldı.'); reload() } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="adm-settings">
      <h3>İki adımlı doğrulama</h3>
      <p className="adm-muted">Şifre çalınsa bile panele girilemesin diye girişte telefondaki doğrulama uygulamasından (Google Authenticator, Microsoft Authenticator vb.) 6 haneli kod istenir. Müşteri verileri bu panelde durduğu için önerilir.</p>
      {error && <Notice kind="error">{error}</Notice>}
      {loading ? <p className="adm-muted">Yükleniyor…</p> : data?.length ? (
        <ul className="adm-numbers">
          {data.map((f) => (
            <li key={f.id}><span>✓ Açık — {f.friendly_name || 'doğrulama uygulaması'}</span><button type="button" className="adm-link" onClick={() => remove(f.id)}>Kapat</button></li>
          ))}
        </ul>
      ) : enroll ? (
        <form className="adm-mfa" onSubmit={confirm}>
          <p>1. Doğrulama uygulamasında “hesap ekle” deyip bu kodu tarayın:</p>
          {enroll.totp?.qr_code && <img src={enroll.totp.qr_code} alt="İki adımlı doğrulama QR kodu" width="180" height="180" />}
          <p className="adm-muted">Tarayamazsanız elle girin: <code dir="ltr">{enroll.totp?.secret}</code></p>
          <label>2. Uygulamanın gösterdiği 6 haneli kod
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          <div className="adm-actions">
            <button className="adm-btn adm-btn--primary">Doğrula ve aç</button>
            <button type="button" className="adm-btn" onClick={() => setEnroll(null)}>Vazgeç</button>
          </div>
        </form>
      ) : (
        <div className="adm-actions"><button type="button" className="adm-btn adm-btn--primary" onClick={start}>İki adımlı doğrulamayı aç</button></div>
      )}
      {msg && <p className="adm-muted" role="status">{msg}</p>}
    </div>
  )
}

/* ---------- ayarlar ---------- */
function Settings() {
  const [{ loading, data, error }, reload] = useAsync(() => settingsApi.get(), [])
  const [numbers, setNumbers] = useState([])
  const [weekly, setWeekly] = useState(true)
  const [draft, setDraft] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!data) return
    setNumbers(Array.isArray(data.notify_numbers) ? data.notify_numbers : [])
    setWeekly(data.weekly_report !== false)
  }, [data])

  const normalize = (raw) => {
    const d = raw.replace(/\D/g, '')
    if (d.length === 10 && d.startsWith('5')) return `90${d}`
    if (d.length === 11 && d.startsWith('05')) return `9${d}`
    if (d.length === 12 && d.startsWith('905')) return d
    return null
  }
  const add = () => {
    const n = normalize(draft)
    if (!n) return setMsg('Numarayı 05xx xxx xx xx biçiminde yazın.')
    if (!numbers.includes(n)) setNumbers([...numbers, n])
    setDraft('')
    setMsg('')
  }
  const save = async () => {
    try {
      await settingsApi.set('notify_numbers', numbers)
      await settingsApi.set('weekly_report', weekly)
      setMsg('Kaydedildi.')
      reload()
    } catch (e) {
      setMsg(`Hata: ${e.message}`)
    }
  }
  const test = async () => {
    setMsg('Deneme mesajı gönderiliyor…')
    try {
      const r = await serverAction('test-bildirim')
      setMsg(r.skipped ? `Gönderilmedi: ${r.skipped}` : `${r.sent}/${r.total} numaraya gönderildi.`)
    } catch (e) {
      setMsg(`Hata: ${e.message}`)
    }
  }
  const pretty = (n) => `0${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10)}`

  return (
    <section aria-labelledby="adm-settings">
      <header className="adm-bar"><h2 id="adm-settings">Bildirim ayarları</h2></header>
      {error && <Notice kind="error">{error}</Notice>}
      {loading ? <p className="adm-muted">Yükleniyor…</p> : (
        <div className="adm-settings">
          <p>Her yeni siparişte ve her pazartesi 09:00’da haftalık özette WhatsApp mesajı gidecek numaralar:</p>
          <ul className="adm-numbers">
            {numbers.map((n) => (
              <li key={n}><span dir="ltr">{pretty(n)}</span><button type="button" className="adm-link" onClick={() => setNumbers(numbers.filter((x) => x !== n))}>Kaldır</button></li>
            ))}
            {numbers.length === 0 && <li className="adm-muted">Henüz numara yok.</li>}
          </ul>
          <div className="adm-inline">
            <input aria-label="Yeni numara" type="tel" inputMode="tel" placeholder="05xx xxx xx xx" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
            <button type="button" className="adm-btn" onClick={add}>Ekle</button>
          </div>
          <label className="adm-check"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} /> Haftalık özet gönder (pazartesi 09:00)</label>
          <div className="adm-actions">
            <button type="button" className="adm-btn adm-btn--primary" onClick={save}>Kaydet</button>
            <button type="button" className="adm-btn" onClick={test}>Deneme bildirimi gönder</button>
            {msg && <span className="adm-muted" role="status">{msg}</span>}
          </div>
        </div>
      )}
      <MfaSetup />
    </section>
  )
}

/* ---------- çerçeve ---------- */
export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [admin, setAdmin] = useState(null)
  const [needMfa, setNeedMfa] = useState(null)
  const [recovery, setRecovery] = useState(false)
  const [tab, setTab] = useState(() => (typeof window !== 'undefined' && TABS.some(([k]) => location.hash === `#${k}`) ? location.hash.slice(1) : 'siparisler'))

  useEffect(() => {
    document.title = 'Yönetim — Er Pervari Bal'
    if (!configured) return undefined
    auth.session().then(setSession)
    const sub = auth.onChange((s, event) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setAdmin(null)
    let live = true
    auth.isAdmin(session.user.id).then((v) => live && setAdmin(v), () => live && setAdmin(false))
    return () => { live = false }
  }, [session])

  // İki adımlı doğrulama kuruluysa, şifreden sonra telefon kodu da istenir.
  useEffect(() => {
    if (!session || !admin) return setNeedMfa(null)
    let live = true
    auth.mfa.level().then(
      (l) => live && setNeedMfa(l.currentLevel === 'aal1' && l.nextLevel === 'aal2'),
      () => live && setNeedMfa(false),
    )
    return () => { live = false }
  }, [session, admin])

  useEffect(() => {
    const onHash = () => { const k = location.hash.slice(1); if (TABS.some(([t]) => t === k)) setTab(k) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (k) => {
    setTab(k)
    history.replaceState(null, '', `#${k}`)
  }

  const body = useMemo(() => ({ siparisler: <Orders />, rapor: <Report />, urunler: <Products />, ayarlar: <Settings /> })[tab], [tab])

  if (!configured) {
    return (
      <div className="adm adm--center">
        <Notice kind="warn">Yönetici paneli henüz kurulmadı. Kurulum adımları: KURULUM-YONETIM.md</Notice>
      </div>
    )
  }
  if (session === undefined) return <div className="adm adm--center"><p className="adm-muted">Yükleniyor…</p></div>
  if (!session || recovery) return <div className="adm adm--center"><Login recovery={recovery} onDone={() => setRecovery(false)} /></div>
  if (admin === null || (admin && needMfa === null)) return <div className="adm adm--center"><p className="adm-muted">Yetki kontrol ediliyor…</p></div>
  if (admin && needMfa) return <div className="adm adm--center"><MfaChallenge onDone={() => setNeedMfa(false)} /></div>
  if (!admin) {
    return (
      <div className="adm adm--center">
        <Notice kind="error">{session.user.email} hesabı yönetici olarak tanımlı değil.</Notice>
        <button type="button" className="adm-btn" onClick={auth.signOut}>Çıkış yap</button>
      </div>
    )
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <strong>Er Pervari Bal <span>Yönetim</span></strong>
        <nav aria-label="Panel bölümleri">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" className={tab === k ? 'is-on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>{label}</button>
          ))}
        </nav>
        <span className="adm-top__user">{session.user.email}</span>
        <a className="adm-link" href="/" target="_blank" rel="noopener">Siteyi aç</a>
        <button type="button" className="adm-link" onClick={auth.signOut}>Çıkış</button>
      </header>
      {isDemo && <p className="adm-demo">DENEME MODU — örnek veriler; hiçbir şey kaydedilmez, mesaj gönderilmez.</p>}
      <main className="adm-main">{body}</main>
    </div>
  )
}
