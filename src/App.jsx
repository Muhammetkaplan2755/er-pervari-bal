import { Suspense, lazy, useEffect } from 'react'
import { CartProvider } from './cart/CartContext.jsx'
import { I18nProvider, useI18n } from './i18n/I18nContext.jsx'
import { useRoute } from './router.js'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Film from './components/Film.jsx'
import Karakovan from './components/Karakovan.jsx'
import Products from './components/Products.jsx'
import Quiz from './components/Quiz.jsx'
import Shop from './components/Shop.jsx'
import Reviews from './components/Reviews.jsx'
import Faq from './components/Faq.jsx'
import Visit from './components/Visit.jsx'
import Footer from './components/Footer.jsx'
import CartDialog from './components/CartDialog.jsx'
import WhatsAppFab from './components/WhatsAppFab.jsx'
import Recipes from './pages/Recipes.jsx'
import Journal from './pages/Journal.jsx'
import Guides from './pages/Guides.jsx'
import Batch from './pages/Batch.jsx'
import Tracking from './pages/Tracking.jsx'
import Corporate from './pages/Corporate.jsx'
import Product from './pages/Product.jsx'
import NotFound from './pages/NotFound.jsx'
import Legal from './pages/Legal.jsx'
import PaymentResult from './pages/PaymentResult.jsx'
import { useDocumentMeta } from './meta.js'
import { useReveal } from './motion/reveal.js'

/* Yönetici paneli ayrı bir parçada: ziyaretçiler bu kodu hiç indirmez. */
const Admin = lazy(() => import('./admin/Admin.jsx'))

function Home() {
  const { t } = useI18n()
  useDocumentMeta(t('meta.title'), t('meta.description'))
  useReveal([])
  return (
    <>
      <Hero />
      <Film />
      <Karakovan />
      <Products />
      <Quiz />
      <Shop />
      <Reviews />
      <Faq />
      <Visit />
    </>
  )
}

function Routes() {
  const route = useRoute()
  const { page, params, anchor, query } = route
  const { t } = useI18n()

  // Every navigation lands at the top, or on its anchor once the home sections have rendered.
  useEffect(() => {
    if (!page && anchor) document.getElementById(anchor)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [route, page, anchor])

  if (page === 'yonetim') {
    return (
      <Suspense fallback={<div className="adm-boot">Yükleniyor…</div>}>
        <Admin />
      </Suspense>
    )
  }

  return (
    <>
      {/* Focus main directly: changing the hash to #main would navigate a sub-page back home. */}
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>{t('skip')}</a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        {page === 'tarifler' && <Recipes />}
        {page === 'gunluk' && <Journal />}
        {page === 'rehber' && <Guides slug={params[0]} key={params[0] ?? ''} />}
        {page === 'parti' && <Batch code={params[0] ?? ''} key={params[0] ?? ''} />}
        {page === 'takip' && <Tracking />}
        {page === 'kurumsal' && <Corporate />}
        {page === 'urun' && <Product id={params[0] ?? ''} query={query} key={params[0] ?? ''} />}
        {page === 'yasal' && <Legal slug={params[0]} key={params[0] ?? ''} />}
        {page === 'odeme' && <PaymentResult query={query} />}
        {page === '404' && <NotFound />}
        {!page && <Home />}
      </main>
      <Footer />
      <CartDialog />
      <WhatsAppFab />
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <CartProvider>
        <Routes />
      </CartProvider>
    </I18nProvider>
  )
}
