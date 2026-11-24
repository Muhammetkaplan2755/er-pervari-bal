// Netlify Functions (v2). iyzico ödeme sonrası buraya döner (public/_redirects: /api/odeme-sonuc).
import { finishPayment } from '../../server/payment.js'
export default finishPayment
