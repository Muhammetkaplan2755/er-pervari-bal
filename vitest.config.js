import { defineConfig } from 'vitest/config'

// Testler sunucu mantığını (fiyat, ödeme doğrulama, sipariş, rapor, bildirim) Node'da çalıştırır.
// Ağa çıkmazlar: fetch gereken yerde sahte (mock) kullanılır, gerçek anahtar gerekmez.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    // Testler gerçek .env değerlerini görmesin: sipariş/ödeme kodu "panel kapalı" varsayılanıyla çalışır.
    env: { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', WHATSAPP_TOKEN: '', WHATSAPP_PHONE_NUMBER_ID: '', CALLMEBOT: '', BREVO_API_KEY: '', MAIL_FROM: '', IYZICO_SECRET_KEY: 'test-secret' },
  },
})
