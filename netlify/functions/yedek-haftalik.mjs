// Netlify Scheduled Function: her pazar 05:00 (İstanbul) veritabanını gizli "yedekler" deposuna yedekler.
import { backupNow } from '../../server/maintenance.js'
import { alertOwner } from '../../server/whatsapp.js'

export default async () => {
  try {
    console.log('haftalık yedek', JSON.stringify(await backupNow()))
  } catch (e) {
    console.error('haftalık yedek', e.message)
    await alertOwner(`⚠️ Er Pervari Bal: haftalık yedek alınamadı (${e.message.slice(0, 120)}).`)
  }
}

export const config = { schedule: '0 2 * * 0' }
