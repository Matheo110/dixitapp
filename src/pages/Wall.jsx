import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const FONT_FAMILY = {
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'Inter': "'Inter', sans-serif",
  'Georgia': 'Georgia, serif',
  'Arial': 'Arial, sans-serif',
}

export default function Wall() {
  const { slug } = useParams()
  const { t, lang } = useLanguage()
  const [testimonials, setTestimonials] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedSource, setCopiedSource] = useState(null)
  const shareRef = useRef(null)

  useEffect(() => {
    Promise.all([
      supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', slug)
        .eq('approved', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('wall_bg_color, wall_primary_color, wall_accent_color, wall_font, wall_title, wall_layout, company, firstname, activity, avatar_url')
        .eq('id', slug)
        .single(),
    ]).then(([{ data: tData, error }, { data: pData }]) => {
      if (error) { setNotFound(true); setLoading(false); return }
      setTestimonials(tData || [])
      setProfile(pData)
      setLoading(false)
    })
  }, [slug])

  useEffect(() => {
    if (!showShareMenu) return
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShareMenu])

  const bg      = profile?.wall_bg_color     || '#F5F0E8'
  const primary = profile?.wall_primary_color || '#1B2B5E'
  const accent  = profile?.wall_accent_color  || '#C8102E'
  const font    = FONT_FAMILY[profile?.wall_font] || FONT_FAMILY['Playfair Display']
  const title   = profile?.wall_title         || t.wall.defaultTitle
  const layout  = profile?.wall_layout        || 'grid'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <span className="text-sm" style={{ color: `${primary}66` }}>{t.wall.loading}</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
        <div className="text-center">
          <p style={{ fontFamily: font, fontSize: '1.5rem', fontWeight: 700, color: primary, marginBottom: '0.5rem' }}>
            {t.wall.notFound}
          </p>
          <p className="text-sm" style={{ color: `${primary}80` }}>{t.wall.notFoundDesc}</p>
        </div>
      </div>
    )
  }

  const headerInitial = (profile?.company || profile?.firstname || 'D')[0].toUpperCase()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ backgroundColor: primary, padding: '1.25rem 1.5rem' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem', fontFamily: font, flexShrink: 0, userSelect: 'none' }}
            >
              {headerInitial}
            </div>
          )}
          <div>
            <p style={{ fontFamily: font, fontWeight: 700, color: bg, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
              {profile?.company || profile?.firstname || 'DIXITAPP'}
            </p>
            {profile?.activity && (
              <p style={{ color: `${bg}99`, fontSize: '0.78rem', marginTop: '0.1rem' }}>
                {profile.activity}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── SHARING ── */}
      <div style={{ backgroundColor: bg, borderBottom: `1px solid ${primary}14`, padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ position: 'relative', display: 'inline-block' }} ref={shareRef}>

            {/* Main toggle button */}
            <button
              onClick={() => setShowShareMenu(s => !s)}
              style={{ backgroundColor: primary, color: bg, padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {lang === 'en' ? 'Share 🔗' : 'Partager 🔗'}
            </button>

            {/* Dropdown */}
            {showShareMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, backgroundColor: '#ffffff', border: '1px solid #E0D8CC', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '230px', zIndex: 20, overflow: 'hidden' }}>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: '#1B2B5E', fontSize: '0.875rem', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>

                {/* X (Twitter) */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(lang === 'en' ? 'Check out my customer testimonials' : 'Découvrez mes témoignages clients')}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: '#1B2B5E', fontSize: '0.875rem', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X (Twitter)
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: '#1B2B5E', fontSize: '0.875rem', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>

                {/* Instagram — copy link + message */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    setCopiedSource('instagram')
                    setShowShareMenu(false)
                    setTimeout(() => setCopiedSource(null), 3500)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#1B2B5E', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="ig-grad-wall" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433"/>
                        <stop offset="50%" stopColor="#dc2743"/>
                        <stop offset="100%" stopColor="#bc1888"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#ig-grad-wall)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </button>

                {/* Copy link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    setCopiedSource('link')
                    setTimeout(() => setCopiedSource(null), 2000)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', borderTop: '1px solid #E0D8CC', backgroundColor: 'transparent', cursor: 'pointer', color: '#1B2B5E', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F0E8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2B5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  {copiedSource === 'link'
                    ? (lang === 'en' ? 'Copied ✓' : 'Copié ✓')
                    : (lang === 'en' ? 'Copy link' : 'Copier le lien')}
                </button>

              </div>
            )}
          </div>

          {/* Confirmation messages */}
          {copiedSource === 'link' && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: `${primary}90`, fontWeight: 500 }}>
              {lang === 'en' ? 'Link copied ✓' : 'Lien copié ✓'}
            </p>
          )}
          {copiedSource === 'instagram' && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: `${primary}90`, fontWeight: 500 }}>
              {lang === 'en' ? 'Link copied! Share it on Instagram 📸' : 'Lien copié ! Partagez-le sur Instagram 📸'}
            </p>
          )}
        </div>
      </div>

      {/* ── HERO TITLE ── */}
      <div className="text-center pt-14 pb-10 px-4">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: accent }}
        >
          {t.wall.customerReviews}
        </p>
        <h1
          style={{ fontFamily: font, fontWeight: 700, color: primary, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.2 }}
        >
          {title}
        </h1>
        <div
          className="mx-auto mt-6 rounded-full"
          style={{ width: 48, height: 3, backgroundColor: accent }}
        />
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16">
        {testimonials.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ fontFamily: font, fontSize: '1.1rem', color: `${primary}55` }}>
              {t.wall.noTestimonials}
            </p>
          </div>
        ) : layout === 'list' ? (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {testimonials.map((item, i) => (
              <WallCard key={item.id} testimonial={item} primary={primary} accent={accent} font={font} index={i} />
            ))}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {testimonials.map((item, i) => (
              <WallCard key={item.id} testimonial={item} primary={primary} accent={accent} font={font} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER BADGE ── */}
      <footer className="text-center py-6" style={{ borderTop: `1px solid ${primary}18` }}>
        <a
          href="https://dixitapp.tech"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', color: '#888', textDecoration: 'none', letterSpacing: '0.03em' }}
        >
          {t.wall.poweredBy} <strong style={{ fontWeight: 600 }}>Dixitapp</strong>
        </a>
      </footer>
    </div>
  )
}

function WallCard({ testimonial, primary, accent, font, index }) {
  const { t } = useLanguage()
  const [filledStars, setFilledStars] = useState(0)

  const initials = testimonial.name
    ? testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  useEffect(() => {
    if (!testimonial.rating) return
    const timers = []
    for (let i = 1; i <= testimonial.rating; i++) {
      timers.push(setTimeout(() => setFilledStars(i), i * 100))
    }
    return () => timers.forEach(clearTimeout)
  }, [testimonial.rating])

  return (
    <div
      className="break-inside-avoid mb-5"
      style={{ animation: `cardFadeIn 0.5s ease ${index * 100}ms both` }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(27,43,94,0.08)',
          borderTop: `3px solid ${accent}`,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(27,43,94,0.14)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(27,43,94,0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {!testimonial.video_url && testimonial.message !== '[Témoignage vidéo]' && (
          <div
            style={{ fontFamily: font, fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.25rem', color: `${accent}25`, userSelect: 'none' }}
            aria-hidden="true"
          >
            "
          </div>
        )}

        {testimonial.video_url ? (
          <video
            src={testimonial.video_url}
            controls
            playsInline
            className="w-full rounded-xl mb-4"
            style={{ backgroundColor: '#000' }}
          />
        ) : testimonial.message === '[Témoignage vidéo]' ? (
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-4"
            style={{ backgroundColor: `${primary}12`, color: primary }}
          >
            {t.wall.videoTag}
          </span>
        ) : (
          <p className="text-sm leading-relaxed mb-4" style={{ color: `${primary}b3` }}>
            {testimonial.message}
          </p>
        )}

        {testimonial.rating && (
          <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: '1rem',
                  display: 'inline-block',
                  color: i < filledStars ? accent : `${primary}26`,
                  transform: i < filledStars ? 'scale(1.2)' : 'scale(1)',
                  transition: 'color 0.15s ease, transform 0.15s ease',
                }}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <div
          className="flex items-center gap-3 pt-4"
          style={{ borderTop: `1px solid ${primary}12` }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: primary }}>
              {testimonial.name}
            </div>
            {(testimonial.role || testimonial.company) && (
              <div className="text-xs truncate" style={{ color: `${primary}66` }}>
                {[testimonial.role, testimonial.company].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
