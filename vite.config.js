import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/* Geliştirmede /api/odeme-* isteklerini server/payment.js'e yönlendirir; canlıda
   aynı işi netlify/functions veya api/ (Vercel) yapar. .env.local'daki IYZICO_*
   değerleri yalnızca bu sunucu tarafında okunur, tarayıcıya gitmez. */
function paymentApi(mode) {
  return {
    name: 'payment-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(mode, process.cwd(), 'IYZICO_'), loadEnv(mode, process.cwd(), 'PUBLIC_ORIGIN'))
      Object.assign(process.env, loadEnv(mode, process.cwd(), ['SUPABASE_', 'VITE_SUPABASE_', 'WHATSAPP_', 'NETLIFY_BUILD_HOOK', 'CALLMEBOT']))
      const routes = {
        '/api/odeme-baslat': ['/server/payment.js', 'startPayment'],
        '/api/odeme-sonuc': ['/server/payment.js', 'finishPayment'],
        '/api/siparis': ['/server/orders.js', 'recordWhatsAppOrder'],
      }
      server.middlewares.use(async (req, res, next) => {
        const path = req.url.split('?')[0]
        const route = routes[path] ?? (path.startsWith('/api/yonetim/') ? ['/server/admin.js', 'adminAction'] : null)
        if (!route) return next()
        try {
          const mod = await server.ssrLoadModule(route[0])
          const chunks = []
          for await (const c of req) chunks.push(c)
          const headers = {}
          for (const k of ['content-type', 'x-forwarded-for', 'authorization', 'origin']) if (req.headers[k]) headers[k] = req.headers[k]
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          })
          const out = await mod[route[1]](request)
          res.statusCode = out.status
          out.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await out.arrayBuffer()))
        } catch (e) {
          next(e)
        }
      })
    },
  }
}

/* Güvenlik kilidi: tarayıcıya giden VITE_SUPABASE_ANON_KEY'e yanlışlıkla gizli
   (secret / service_role) anahtar yazılırsa build ve geliştirme sunucusu durur. */
function assertPublicSupabaseKey(mode) {
  const key = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }.VITE_SUPABASE_ANON_KEY || ''
  let role = ''
  try { role = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString()).role || '' } catch { /* yeni biçim anahtar */ }
  if (key.startsWith('sb_secret_') || role === 'service_role') {
    throw new Error('VITE_SUPABASE_ANON_KEY gizli anahtar içeriyor! Buraya yalnızca publishable / anon anahtar yazılır.')
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  assertPublicSupabaseKey(mode)
  return {
    plugins: [react(), paymentApi(mode)],
    build: {
      // three.js lives in its own lazy chunk (honeycombScene, ~130 kB gzip),
      // loaded only on wide screens after page load, so its size is expected.
      chunkSizeWarningLimit: 600,
    },
  }
})
