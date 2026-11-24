// Netlify Scheduled Function: her pazartesi 09:00 (İstanbul) = 06:00 UTC.
// Bildirim numaralarına geçen haftanın özetini WhatsApp'tan gönderir.
import { sendWeeklyReport } from '../../server/admin.js'

export default async () => {
  const r = await sendWeeklyReport()
  console.log('haftalık rapor', JSON.stringify(r))
}

export const config = { schedule: '0 6 * * 1' }
