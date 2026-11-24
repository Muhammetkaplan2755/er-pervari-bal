// Vercel Functions (Web API imzası). iyzico ödeme sonrası buraya POST eder.
import { finishPayment } from '../server/payment.js'
export const POST = finishPayment
