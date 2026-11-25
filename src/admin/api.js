/* Yönetici paneli veri katmanı. Tarayıcıda herkese açık (anon) anahtarla
   çalışır; neye erişilebileceğini veritabanındaki RLS kuralları belirler
   (supabase/schema.sql): yalnızca admins tablosundaki kullanıcılar sipariş,
   maliyet ve ayarları görür/değiştirir. Bu dosya yalnızca /yonetim açılınca yüklenir.

   Deneme modu: geliştirmede (npm run dev) /yonetim?demo adresi, hesap kurmadan
   paneli örnek verilerle açar (src/admin/demo.js). Canlı sitede yoktur. */
import { createClient } from '@supabase/supabase-js'
import { makeDemo } from './demo.js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const DEMO = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo')

const supabase = !DEMO && URL && KEY ? createClient(URL, KEY, { auth: { persistSession: true, storageKey: 'erpervari-yonetim' } }) : null
const BUCKET = 'urunler'

const must = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

const real = {
  auth: {
    session: async () => (await supabase.auth.getSession()).data.session,
    onChange: (fn) => supabase.auth.onAuthStateChange((event, session) => fn(session, event)).data.subscription,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }).then(must),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/yonetim` }).then(must),
    // Geçici şifreyle açılan hesapta işaret de kaldırılır (ilk girişte şifre değiştirme zorunlu).
    updatePassword: (password) => supabase.auth.updateUser({ password, data: { gecici_sifre: null } }).then(must),
    /* Panel yetkisi: 'sahip' | 'personel' | null (yönetici değil). */
    // (role sütunu yoksa — migration öncesi — tek yönetici sahiptir; sunucu yine kendisi denetler.)
    role: async (userId) => {
      const row = must(await supabase.from('admins').select('*').eq('user_id', userId))[0]
      return row ? (row.role ?? 'sahip') : null
    },
    /* İki adımlı doğrulama (TOTP: Google Authenticator, Microsoft Authenticator vb.). */
    mfa: {
      level: async () => must(await supabase.auth.mfa.getAuthenticatorAssuranceLevel()),
      factors: async () => (must(await supabase.auth.mfa.listFactors()).totp ?? []).filter((f) => f.status === 'verified'),
      enroll: async () => {
        // Yarım kalmış (doğrulanmamış) kurulumlar yeni kurulumu engellemesin.
        const all = must(await supabase.auth.mfa.listFactors()).all ?? []
        for (const f of all.filter((x) => x.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id })
        return must(await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Yönetim ${new Date().toISOString().slice(0, 10)}` }))
      },
      verify: async (factorId, code) => must(await supabase.auth.mfa.challengeAndVerify({ factorId, code })),
      unenroll: async (factorId) => must(await supabase.auth.mfa.unenroll({ factorId })),
    },
  },
  products: {
    list: async () => must(await supabase.from('products').select('*').order('sort').order('id')),
    save: async (p) => must(await supabase.from('products').upsert(p).select().single()),
  },
  costs: {
    list: async () => must(await supabase.from('variant_costs').select('*')),
    saveMany: async (rows) => (rows.length ? must(await supabase.from('variant_costs').upsert(rows)) : null),
  },
  /* Stok adedi (boyut başına). Satırı olmayan boyut takip edilmez. */
  inventory: {
    list: async () => must(await supabase.from('inventory').select('*')),
    save: async (rows) => (rows.length ? must(await supabase.from('inventory').upsert(rows)) : null),
    remove: async (productId, variantIds) =>
      (variantIds.length ? must(await supabase.from('inventory').delete().eq('product_id', productId).in('variant_id', variantIds)) : null),
  },
  orders: {
    between: async (fromIso, toIso) =>
      must(await supabase.from('orders').select('*').gte('created_at', fromIso).lt('created_at', toIso).order('created_at', { ascending: false })),
    update: async (id, patch) => must(await supabase.from('orders').update(patch).eq('id', id).select().single()),
  },
  /* İşlem kaydı (yalnızca sahip okuyabilir; RLS). */
  audit: {
    list: async (limit = 100) => must(await supabase.from('audit_log').select('*').order('at', { ascending: false }).limit(limit)),
  },
  settings: {
    get: async () => Object.fromEntries(must(await supabase.from('settings').select('key,value')).map((r) => [r.key, r.value])),
    set: async (key, value) => must(await supabase.from('settings').upsert({ key, value })),
  },
  /* Ürün fotoğrafları: Supabase Storage "urunler" kovası (herkese açık okuma). */
  images: {
    upload: async (productId, file) => {
      const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
      const path = `${productId}/${Date.now().toString(36)}.${ext}`
      must(await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', contentType: file.type, upsert: false }))
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    },
    remove: async (url) => {
      const marker = `/object/public/${BUCKET}/`
      const path = url.includes(marker) ? decodeURIComponent(url.split(marker)[1]) : null
      if (path) must(await supabase.storage.from(BUCKET).remove([path]))
    },
  },
  serverAction: async (action, body) => {
    const session = await real.auth.session()
    const res = await fetch(`/api/yonetim/${action}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session?.access_token ?? ''}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const out = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(out.error || `HTTP ${res.status}`)
    return out
  },
}

const api = DEMO ? makeDemo() : real

export const configured = DEMO || Boolean(supabase)
export const isDemo = DEMO
export const { auth, products, costs, inventory, orders, audit, settings, images, serverAction } = api
