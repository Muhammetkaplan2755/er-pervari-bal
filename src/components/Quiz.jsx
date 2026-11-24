import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { findItem, formatTL } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { Plus } from './icons.jsx'
import { productHref } from '../router.js'
import './Quiz.css'

const QUESTIONS = [
  { id: 'use', key: 'quiz.q1', options: ['spread', 'spoon', 'cook', 'gift'] },
  { id: 'taste', key: 'quiz.q2', options: ['mild', 'bold'] },
  { id: 'texture', key: 'quiz.q3', options: ['liquid', 'cream', 'comb'] },
]

/* Small decision table: texture decides first, then use and taste refine it. */
function recommend({ use, taste, texture }) {
  if (use === 'gift') return taste === 'bold' || texture === 'comb' ? ['kutu-karakovan', 'kutu'] : ['kutu-kahvalti', 'kutu']
  if (texture === 'comb') return taste === 'bold' ? ['karakovan', '500g'] : ['cerceve', '1kg']
  if (texture === 'cream' || use === 'spread') return ['krem', '250g']
  return ['suzme', '500g']
}

const whyKey = (productId) => `quiz.why.${productId.startsWith('kutu') ? 'kutu' : productId}`

export default function Quiz() {
  const { t, pick } = useI18n()
  const { add, open } = useCart()
  const [answers, setAnswers] = useState({})
  const step = QUESTIONS.findIndex((q) => !answers[q.id])
  const done = step === -1

  const result = done ? findItem(...recommend(answers)) : null

  // Answering replaces the question, which removes the focused button; keep focus in the card.
  const focusRef = useRef(null)
  const hasAnswered = useRef(false)
  const answered = Object.keys(answers).length
  useEffect(() => {
    // Skip the initial render, but return focus to question one on restart too.
    if (answered > 0 || hasAnswered.current) focusRef.current?.focus()
    if (answered > 0) hasAnswered.current = true
  }, [answered])

  return (
    <section className="quiz theme-light" id="secici" aria-labelledby="quiz-title">
      <div className="store-intro">
        <h2 className="store-title" id="quiz-title">{t('quiz.title1')} {t('quiz.title2')}</h2>
        <p className="store-lede">{t('quiz.desc')}</p>
      </div>

      <div className="quiz__card" aria-live="polite">
        {!done && (
          <fieldset className="quiz__q" key={QUESTIONS[step].id}>
            <legend ref={focusRef} tabIndex={-1}>
              {t(QUESTIONS[step].key)}
            </legend>
            <div className="quiz__options">
              {QUESTIONS[step].options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [QUESTIONS[step].id]: opt }))}
                >
                  {t(`${QUESTIONS[step].key}.${opt}`)}
                </button>
              ))}
            </div>
            <p className="quiz__step">{t('quiz.step', step + 1, QUESTIONS.length)}</p>
          </fieldset>
        )}

        {done && result && (
          <div className="quiz__result">
            <h3 ref={focusRef} tabIndex={-1}>{pick(result.product.name)}</h3>
            <span className="quiz__size">{pick(result.variant.label)}</span>
            <p>{t(whyKey(result.product.id))}</p>
            <span className="quiz__price">{formatTL(result.variant.price)}</span>
            <div className="quiz__actions">
              <button
                type="button"
                className="btn btn--ink"
                disabled={result.product.stock === 'out'}
                onClick={() => { add(result.product.id, result.variant.id); open() }}
              >
                <Plus className="quiz__plus" /> {t('shop.add')}, {formatTL(result.variant.price)}
              </button>
              <a className="store-link" href={productHref(result.product.id, result.product.variants.length > 1 ? result.variant.id : undefined)}>{t('pd.view')}</a>
              <button type="button" className="store-link" onClick={() => setAnswers({})}>{t('quiz.again')}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
