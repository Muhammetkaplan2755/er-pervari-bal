/* Gizli anahtar kalkanı — depoya anahtar girmesin.
   Kullanım:
     node scripts/secret-scan.mjs --staged   git'e eklenen (commit edilecek) dosyaları tarar (pre-commit kancası)
     node scripts/secret-scan.mjs            depodaki tüm izlenen dosyaları tarar (CI ve elle kontrol)
   Bir şey bulursa çıkış kodu 1 olur ve commit / CI durur. Bulunan değeri ASLA ekrana yazmaz. */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const staged = process.argv.includes('--staged')
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const files = (staged ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR') : git('ls-files'))
  .split('\n').map((f) => f.trim()).filter(Boolean)

// Hiç girmemesi gereken dosya adları
const BANNED_NAME = [
  [/(^|\/)\.env(\.|$)(?!example$)/, '.env dosyası'],
  [/(^|\/)[^/]*\.env$/, '.env dosyası'],
  [/\.(pem|key|p12|pfx)$/i, 'anahtar/sertifika dosyası'],
  [/(^|\/)(credentials|service-account)[^/]*\.json$/i, 'kimlik bilgisi dosyası'],
]

// İçerikte aranan kalıplar (yer tutucular — ANAHTAR, xxx, your-... — eşleşmez)
const PATTERNS = [
  [/sb_secret_[A-Za-z0-9_-]{16,}/, 'Supabase gizli anahtarı'],
  [/sb_publishable_[A-Za-z0-9_-]{16,}/, 'Supabase publishable anahtarı (yalnızca barındırma ayarında dursun)'],
  [/eyJhbGciOi[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, 'JWT / Supabase eski tip anahtar'],
  [/sandbox-[A-Za-z0-9]{24,}/, 'iyzico deneme anahtarı'],
  [/\b(IYZICO_(API|SECRET)_KEY|SUPABASE_SERVICE_ROLE_KEY|WHATSAPP_TOKEN|NETLIFY_BUILD_HOOK|PERPLEXITY_API_KEY|FIRECRAWL_API_KEY|COMPOSIO_API_KEY|BREVO_API_KEY)[ \t]*=[ \t]*(?!ANAHTAR)(?!your)[^\s'"#]{12,}/m, 'anahtar ataması'],
  [/\bCALLMEBOT[ \t]*=[ \t]*\d{10,}:(?!ANAHTAR)[A-Za-z0-9]{4,}/, 'CallMeBot anahtarı'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'özel anahtar'],
  [/\b(ghp|gho|github_pat)_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/\bsk-[A-Za-z0-9_-]{32,}/, 'API anahtarı (sk-…)'],
  [/\bphc_[A-Za-z0-9]{30,}/, 'PostHog proje anahtarı'],
  [/\bfc-[A-Za-z0-9]{24,}/, 'Firecrawl anahtarı'],
  [/\bpplx-[A-Za-z0-9]{24,}/, 'Perplexity anahtarı'],
  [/\bxkeysib-[A-Za-z0-9-]{40,}/, 'Brevo API anahtarı'],
  [/\b\d{8,10}:AA[A-Za-z0-9_-]{30,}/, 'Telegram bot anahtarı'],
  [/\bxsmtpsib-[A-Za-z0-9-]{40,}/, 'Brevo SMTP anahtarı'],
  [/hooks\.netlify\.com\/build_hooks\/[a-f0-9]{16,}/, 'Netlify build hook adresi'],
]

const SKIP_CONTENT = /\.(jpe?g|png|webp|avif|gif|ico|woff2?|ttf|otf|glb|mp4|pdf)$/i

const problems = []
for (const f of files) {
  const name = f.replace(/\\/g, '/')
  for (const [re, why] of BANNED_NAME) if (re.test(name)) problems.push(`${name}: ${why} depoya eklenemez`)
  if (SKIP_CONTENT.test(name) || name === 'scripts/secret-scan.mjs') continue
  let text
  try {
    text = staged ? git('show', `:${name}`) : readFileSync(name, 'utf8')
  } catch { continue }
  for (const [re, why] of PATTERNS) {
    const m = re.exec(text)
    if (m) {
      const line = text.slice(0, m.index).split('\n').length
      problems.push(`${name}:${line}: ${why} bulundu (değer gizlendi)`)
    }
  }
}

if (problems.length) {
  console.error('\n⛔ GİZLİ ANAHTAR KALKANI — işlem durduruldu:\n')
  for (const p of problems) console.error('  - ' + p)
  console.error('\nAnahtarları yalnızca .env.development.local / .env.local ve barındırma panelinde tutun.\n')
  process.exit(1)
}
console.log(`gizli anahtar taraması temiz (${files.length} dosya)`)
