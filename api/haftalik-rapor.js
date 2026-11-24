// Vercel Cron (vercel.json "crons") bu adresi her pazartesi 06:00 UTC çağırır.
import { sendWeeklyReport } from '../server/admin.js'

export async function GET(request) {
  // Vercel cron isteği CRON_SECRET ile imzalanır; başkası tetikleyemesin.
  // CRON_SECRET tanımlı değilse de kapalı (fail-closed): herkes rapor tetikleyemesin.
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 })
  }
  return Response.json(await sendWeeklyReport())
}
