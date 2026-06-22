import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const plans = [
  {
    key: 'free',
    name: 'Free',
    price: '0€',
    period: '/mois',
    features: ['5 témoignages', 'Widget avec branding', 'Texte uniquement'],
    cta: 'Commencer gratuitement',
    featured: false,
    href: '/login',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '29€',
    period: '/mois',
    features: ['Témoignages illimités', 'Vidéo + texte', 'Sans branding', 'Support prioritaire'],
    cta: 'Choisir Pro',
    featured: true,
    href: '/pricing',
  },
  {
    key: 'agency',
    name: 'Agency',
    price: '79€',
    period: '/mois',
    features: ['Multi-comptes', 'White label', 'Accès API', 'Onboarding dédié'],
    cta: 'Choisir Agency',
    featured: false,
    href: '/pricing',
  },
]

const steps = [
  {
    num: '01',
    title: 'Invitez vos clients',
    desc: 'Générez un lien unique pour chaque client en quelques secondes.',
  },
  {
    num: '02',
    title: 'Ils témoignent en 2 minutes',
    desc: 'Écrit ou vidéo, sans créer de compte. Zero friction pour eux.',
  },
  {
    num: '03',
    title: 'Affichez automatiquement',
    desc: 'Approuvez et intégrez les témoignages directement sur votre site.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: '#1B2B5E', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#F5F0E8', letterSpacing: '0.15em', fontSize: '1.125rem', textTransform: 'uppercase', userSelect: 'none' }}
          >
            DIXITAPP
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'transparent', border: '1px solid #F5F0E8', color: '#F5F0E8', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(245,240,232,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{ backgroundColor: '#C8102E', color: '#F5F0E8', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, border: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#a80d26')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8102E')}
            >
              Commencer gratuitement
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: '#F5F0E8', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <h1
            style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '3rem', color: '#1B2B5E', lineHeight: 1.18, marginBottom: '1.5rem' }}
          >
            Vos clients témoignent.<br />Automatiquement.
          </h1>
          <p
            style={{ fontSize: '1rem', color: '#555', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 2.5rem' }}
          >
            Collectez des avis vidéo et texte en un lien unique. Affichez-les sur votre site en quelques secondes. Sans relances, sans friction.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ backgroundColor: '#1B2B5E', color: '#F5F0E8', padding: '0.85rem 2rem', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Commencer gratuitement
            </button>
            <button
              onClick={() => navigate('/pricing')}
              style={{ backgroundColor: 'transparent', color: '#1B2B5E', padding: '0.85rem 2rem', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: 600, border: '1.5px solid #1B2B5E', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Voir les plans
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: '#ffffff', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2
            style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2rem', color: '#1B2B5E', textAlign: 'center', marginBottom: '0.75rem' }}
          >
            Comment ça marche ?
          </h2>
          <div style={{ width: 40, height: 3, backgroundColor: '#C8102E', borderRadius: '9999px', margin: '0 auto 3.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {steps.map(step => (
              <div key={step.num} style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div
                  style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#F5F0E8', border: '2px solid #1B2B5E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1B2B5E', fontSize: '0.85rem' }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2B5E', marginBottom: '0.6rem' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.65 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ backgroundColor: '#F5F0E8', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2
            style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2rem', color: '#1B2B5E', textAlign: 'center', marginBottom: '0.75rem' }}
          >
            Tarifs simples et transparents
          </h2>
          <div style={{ width: 40, height: 3, backgroundColor: '#C8102E', borderRadius: '9999px', margin: '0 auto 3.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {plans.map(plan => (
              <div
                key={plan.key}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1rem',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid #E0D8CC',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
                  cursor: 'default',
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
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ backgroundColor: '#C8102E', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                      Recommandé
                    </span>
                  </div>
                )}
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: '#1B2B5E', marginBottom: '0.25rem' }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2.5rem', color: plan.featured ? '#C8102E' : '#1B2B5E' }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(27,43,94,0.45)', marginBottom: '0.3rem' }}>
                    {plan.period}
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'rgba(27,43,94,0.7)' }}>
                      <svg style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: '#C8102E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.href)}
                  style={plan.featured
                    ? { backgroundColor: '#C8102E', color: '#ffffff', width: '100%', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }
                    : { backgroundColor: '#1B2B5E', color: '#F5F0E8', width: '100%', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }
                  }
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center', marginTop: 'auto' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
      </footer>

    </div>
  )
}
