// WhatsApp siparişlerinin kaydı (public/_redirects: /api/siparis).
import { recordWhatsAppOrder } from '../../server/orders.js'
// context.ip: Netlify'ın tespit ettiği gerçek ziyaretçi IP'si (istemci değiştiremez).
export default (request, context) => recordWhatsAppOrder(request, { ip: context?.ip })
