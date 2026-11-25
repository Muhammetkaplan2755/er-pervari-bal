// Yönetici paneli işlemleri (public/_redirects: /api/yonetim/*).
import { adminAction } from '../../server/admin.js'
// context.ip: Netlify'ın tespit ettiği gerçek IP (iyzico iade isteğine yazılır).
export default (request, context) => adminAction(request, { ip: context?.ip })
