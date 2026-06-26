import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

// Fade-in + slide-up when element enters viewport
function RevealDiv({ delay = 0, style, children, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Counts up from 0 to target when it enters the viewport
function CountUp({ target, duration = 1500 }) {
  const ref = useRef(null)
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          obs.disconnect()
          let t0 = null
          const tick = (ts) => {
            if (t0 === null) t0 = ts
            const p = Math.min((ts - t0) / duration, 1)
            setCount(Math.floor(p * target))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])
  return <span ref={ref}>{count}</span>
}

export default function Landing() {
  const navigate = useNavigate()
  const { lang, setLanguage, t } = useLanguage()
  const heroRef = useRef(null)
  const pricingRef = useRef(null)
  const [parallaxY, setParallaxY] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  // Parallax: hero content moves 20% of scroll speed → background peels away slower
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      if (heroRef.current.getBoundingClientRect().bottom > 0) {
        setParallaxY(window.scrollY * 0.2)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const plans = [
    {
      key: 'free',
      name: 'Free',
      price: '0€',
      period: t.landing.perMonth,
      features: t.landing.planFeatures.free,
      cta: t.landing.planCtaFree,
      featured: false,
      href: '/login',
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '29€',
      period: t.landing.perMonth,
      features: t.landing.planFeatures.pro,
      cta: t.landing.planCtaPro,
      featured: true,
      href: '/pricing',
    },
    {
      key: 'agency',
      name: 'Agency',
      price: '79€',
      period: t.landing.perMonth,
      features: t.landing.planFeatures.agency,
      cta: t.landing.planCtaAgency,
      featured: false,
      href: '/pricing',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: '#1B2B5E', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#F5F0E8', letterSpacing: '0.15em', fontSize: '1.125rem', textTransform: 'uppercase', userSelect: 'none' }}
          >
            DIXITAPP
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
              <button
                onClick={() => setLanguage('fr')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontWeight: lang === 'fr' ? 700 : 400, color: lang === 'fr' ? '#ffffff' : 'rgba(255,255,255,0.45)' }}
              >
                FR
              </button>
              <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 1px' }}>|</span>
              <button
                onClick={() => setLanguage('en')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontWeight: lang === 'en' ? 700 : 400, color: lang === 'en' ? '#ffffff' : 'rgba(255,255,255,0.45)' }}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'transparent', border: '1px solid #F5F0E8', color: '#F5F0E8', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(245,240,232,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {t.nav.login}
            </button>
            <button
              onClick={() => navigate('/login?tab=signup')}
              style={{ backgroundColor: '#C8102E', color: '#F5F0E8', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, border: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#a80d26')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8102E')}
            >
              {t.nav.signup}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ backgroundColor: '#F5F0E8', padding: '6rem 1.5rem', overflow: 'hidden' }}>
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            textAlign: 'center',
            transform: `translateY(${parallaxY}px)`,
            willChange: 'transform',
          }}
        >
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '3.5rem',
              color: '#1B2B5E',
              lineHeight: 1.15,
              marginBottom: '1rem',
              animation: 'fadeSlideUp 0.6s ease 0ms both',
            }}
          >
            {t.landing.welcome}
          </h1>
          <p
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '1.5rem',
              color: '#1B2B5E',
              lineHeight: 1.35,
              marginBottom: '1.25rem',
              animation: 'fadeSlideUp 0.6s ease 150ms both',
            }}
          >
            {t.landing.subtitle}
          </p>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#888',
              lineHeight: 1.7,
              maxWidth: '560px',
              margin: '0 auto 1.5rem',
              animation: 'fadeSlideUp 0.6s ease 250ms both',
            }}
          >
            {t.landing.description}
          </p>

          {/* ── COUNTER ── */}
          <p
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#C8102E',
              marginBottom: '2.5rem',
              animation: 'fadeSlideUp 0.6s ease 350ms both',
            }}
          >
            <CountUp target={234} />+ {lang === 'en' ? 'freelancers trust us' : 'freelances nous font confiance'}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'fadeSlideUp 0.6s ease 450ms both',
            }}
          >
            <button
              onClick={() => navigate('/login')}
              style={{ backgroundColor: '#1B2B5E', color: '#F5F0E8', padding: '0.85rem 2rem', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t.landing.ctaStart}
            </button>
            <button
              onClick={scrollToPricing}
              style={{ backgroundColor: 'transparent', color: '#1B2B5E', padding: '0.85rem 2rem', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: 600, border: '1.5px solid #1B2B5E', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {t.landing.ctaPlans}
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: '#ffffff', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <RevealDiv>
            <h2
              style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2rem', color: '#1B2B5E', textAlign: 'center', marginBottom: '0.75rem' }}
            >
              {t.landing.howItWorks}
            </h2>
            <div style={{ width: 40, height: 3, backgroundColor: '#C8102E', borderRadius: '9999px', margin: '0 auto 3.5rem' }} />
          </RevealDiv>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {t.landing.steps.map((step, i) => (
              <RevealDiv key={i} delay={i * 150}>
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div
                    style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#F5F0E8', border: '2px solid #1B2B5E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1B2B5E', fontSize: '0.85rem' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2B5E', marginBottom: '0.6rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section ref={pricingRef} style={{ backgroundColor: '#F5F0E8', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <RevealDiv>
            <h2
              style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2rem', color: '#1B2B5E', textAlign: 'center', marginBottom: '0.75rem' }}
            >
              {t.landing.pricingTitle}
            </h2>
            <div style={{ width: 40, height: 3, backgroundColor: '#C8102E', borderRadius: '9999px', margin: '0 auto 3.5rem' }} />
          </RevealDiv>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {plans.map((plan, i) => (
              <RevealDiv key={plan.key} delay={i * 150} style={{ height: '100%' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #E0D8CC',
                    boxShadow: 'none',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, outline 0.3s ease',
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
                        {t.landing.recommended}
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
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#111827', padding: '1.25rem 2.5rem', textAlign: 'center', marginTop: 'auto' }}>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>© 2025 dixitapp.tech — Fait en France 🇫🇷</span>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.5rem' }}>·</span>
        <a href="/cgv" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>CGV</a>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/mentions" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>Mentions légales</a>
        <span style={{ color: '#444', fontSize: '0.8rem', margin: '0 0.4rem' }}>|</span>
        <a href="/privacy" style={{ color: '#666', fontSize: '0.8rem', textDecoration: 'none' }}>Confidentialité</a>
      </footer>

    </div>
  )
}
