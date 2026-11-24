// Vercel Functions (Web API imzası). Barındırma Vercel ise kullanılır.
import { startPayment } from '../server/payment.js'
export const POST = startPayment
