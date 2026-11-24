// Netlify Functions (v2). public/_redirects: /api/odeme-baslat → buraya.
import { startPayment } from '../../server/payment.js'
// context.ip: Netlify'ın tespit ettiği gerçek ziyaretçi IP'si (istemci değiştiremez).
export default (request, context) => startPayment(request, { ip: context?.ip })
