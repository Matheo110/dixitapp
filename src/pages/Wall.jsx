import { useState, useEffect } from 'react'
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
  const { t } = useLanguage()
  const [testimonials, setTestimonials] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
