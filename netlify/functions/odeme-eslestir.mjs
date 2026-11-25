// Netlify Scheduled Function: her 15 dakikada bir yarıda kalan kartlı ödemeleri iyzico'ya sorar.
import { reconcilePayments } from '../../server/reconcile.js'

export default async () => {
  const r = await reconcilePayments()
  console.log('ödeme eşleştirme', JSON.stringify(r))
}

export const config = { schedule: '*/15 * * * *' }
