// Vercel Cron: yarıda kalan ödemeleri eşleştir. (Not: Vercel ücretsiz planında cron günde bir kez çalışır.)
import { reconcilePayments } from '../server/reconcile.js'

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 })
  }
  return Response.json(await reconcilePayments())
}
