import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useLanguage } from '../context/LanguageContext'

export default function Pricing() {
  const [loading, setLoading] = useState(null)
  const [checkoutError, setCheckoutError] = useState(null)
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  const plans = [
    {
      key: 'free',
      name: 'Free',
      price: '0€',
      period: t.pricing.perMonth,
      features: t.pricing.features.free,
      cta: t.pricing.ctaFree,
      featured: false,
      priceId: null,
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '29€',
      period: t.pricing.perMonth,
      features: t.pricing.features.pro,
      cta: t.pricing.ctaPro,
      featured: true,
      priceId: 'price_1Tl6wCIxd1EjjYKHZiUCdX69',
    },
    {
      key: 'agency',
      name: 'Agency',
      price: '79€',
      period: t.pricing.perMonth,
      features: t.pricing.features.agency,
      cta: t.pricing.ctaAgency,
      featured: false,
      priceId: 'price_1Tl6xmIxd1EjjYKHqEEKndhX',
      comingSoon: true,
    },
  ]

  const handleCheckout = async (plan) => {
    if (!plan.priceId) {
      navigate('/login')
      return
    }
    setLoading(plan.key)
    setCheckoutError(null)
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      },
    })
    if (error || !data?.url) {
      setCheckoutError(t.pricing.checkoutError)
      setLoading(null)
      return
    }
    window.location.href = data.url
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      <Navbar />

      <div className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">

          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#1B2B5E', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: '2rem', display: 'inline-block' }}
          >
            {t.pricing.backToDashboard}
          </button>

          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl mb-4" style={{ color: '#1B2B5E' }}>
              {t.pricing.title}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(27,43,94,0.55)' }}>
              {t.pricing.subtitle}
            </p>
            <div className="mx-auto mt-5 rounded-full" style={{ width: 40, height: 3, backgroundColor: '#C8102E' }} />
          </div>

          {checkoutError && (
            <p className="text-center text-sm mb-6" style={{ color: '#C8102E' }}>{checkoutError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div
                key={plan.key}
                className="bg-white rounded-2xl p-7 flex flex-col"
                style={{
                  border: '1px solid #E0D8CC',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
                  cursor: 'pointer',
                  outline: 'none',
                  outlineOffset: '0px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(27,43,94,0.15)'
                  e.currentTarget.style.outline = '2px solid #1B2B5E'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.outline = 'none'
                }}
              >
                {plan.featured && (
                  <div className="mb-4">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#C8102E', color: '#ffffff' }}
                    >
                      {t.pricing.recommended}
                    </span>
                  </div>
                )}

                <h2 className="font-display font-bold text-xl mb-1" style={{ color: '#1B2B5E' }}>
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1 mb-6">
                  <span
                    className="font-display font-bold text-4xl"
                    style={{ color: plan.featured ? '#C8102E' : '#1B2B5E' }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm mb-1" style={{ color: 'rgba(27,43,94,0.45)' }}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(27,43,94,0.7)' }}>
                      <svg
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: '#C8102E' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                      {plan.comingSoon && (
                        <em style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic', marginLeft: '0.2rem', flexShrink: 0 }}>
                          {lang === 'en' ? '(soon)' : '(bientôt)'}
                        </em>
                      )}
                    </li>
                  ))}
                </ul>

                {plan.comingSoon ? (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-semibold text-sm"
                      style={{ backgroundColor: '#888', color: '#F5F0E8', cursor: 'not-allowed', opacity: 0.6, border: 'none' }}
                    >
                      {plan.cta}
                    </button>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#888', fontStyle: 'italic' }}>
                      {lang === 'en' ? 'Coming soon' : 'Bientôt disponible'}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loading === plan.key}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={plan.featured
                      ? { backgroundColor: '#C8102E', color: '#ffffff' }
                      : { backgroundColor: '#1B2B5E', color: '#F5F0E8' }
                    }
                    onMouseEnter={e => { if (loading !== plan.key) e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {loading === plan.key ? t.pricing.loading : plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      <footer style={{ background: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
      </footer>
    </div>
  )
}
