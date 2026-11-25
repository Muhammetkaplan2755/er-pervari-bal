// Netlify Scheduled Function: her gece 03:00 (İstanbul) KVKK saklama süresi dolan tamamlanmamış siparişleri anonimleştirir.
import { anonymizeStale } from '../../server/maintenance.js'

export default async () => {
  console.log('kvkk temizlik', JSON.stringify(await anonymizeStale()))
}

export const config = { schedule: '0 0 * * *' }
